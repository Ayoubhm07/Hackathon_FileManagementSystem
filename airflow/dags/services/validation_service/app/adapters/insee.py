"""
INSEE SIRENE API adapter.

Handles:
  - OAuth2 Client Credentials token lifecycle
  - In-memory token + response caching (configurable TTL)
  - Rate limiting guard (30 req/min for free tier)
  - Retry with exponential back-off
  - Circuit breaker pattern (OPEN after 3 consecutive 5xx)

Never raises on network errors — returns None so the caller can emit
a CheckStatus.ERROR without crashing the validation pipeline.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

import httpx

from shared.schemas import CompanyInfo
from ..config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Simple in-memory cache (suitable for single-process; swap for Redis in prod)
# ---------------------------------------------------------------------------

@dataclass
class _CacheEntry:
    value: Optional[CompanyInfo]
    expires_at: float


_token_cache: dict[str, _CacheEntry] = {}
_response_cache: dict[str, _CacheEntry] = {}

# Circuit breaker state
_cb_failures = 0
_cb_open_until: float = 0.0
_CB_THRESHOLD = 3
_CB_RESET_SECONDS = 60

# Rate limiter state
_rate_window_start: float = time.monotonic()
_rate_count: int = 0


def _is_circuit_open() -> bool:
    return time.monotonic() < _cb_open_until


def _record_failure():
    global _cb_failures, _cb_open_until
    _cb_failures += 1
    if _cb_failures >= _CB_THRESHOLD:
        _cb_open_until = time.monotonic() + _CB_RESET_SECONDS
        logger.warning("INSEE circuit breaker OPEN for %ds", _CB_RESET_SECONDS)


def _record_success():
    global _cb_failures
    _cb_failures = 0


async def _check_rate_limit():
    global _rate_window_start, _rate_count
    now = time.monotonic()
    if now - _rate_window_start >= 60:
        _rate_window_start = now
        _rate_count = 0
    _rate_count += 1
    if _rate_count > settings.insee_rate_limit_per_min:
        # Sleep until next window
        sleep_for = 60 - (now - _rate_window_start)
        logger.info("INSEE rate limit reached — sleeping %.1fs", sleep_for)
        await asyncio.sleep(max(sleep_for, 0))
        _rate_window_start = time.monotonic()
        _rate_count = 1


# ---------------------------------------------------------------------------
# Token management
# ---------------------------------------------------------------------------

async def _get_token(client: httpx.AsyncClient) -> Optional[str]:
    cache_key = "access_token"
    cached = _token_cache.get(cache_key)
    if cached and cached.expires_at > time.monotonic():
        return cached.value.denomination if cached.value else None  # type: ignore[union-attr]

    # Actual token fetch — stored differently, let's use a plain string
    return await _fetch_fresh_token(client)


async def _fetch_fresh_token(client: httpx.AsyncClient) -> Optional[str]:
    if not settings.insee_client_id or not settings.insee_client_secret:
        logger.warning("INSEE credentials not configured — skipping external validation")
        return None
    try:
        resp = await client.post(
            settings.insee_token_url,
            data={"grant_type": "client_credentials"},
            auth=(settings.insee_client_id, settings.insee_client_secret),
            timeout=settings.insee_request_timeout,
        )
        resp.raise_for_status()
        payload = resp.json()
        token: str = payload["access_token"]
        ttl: int = payload.get("expires_in", 3600)
        # Store raw token string under a special key
        _token_cache["access_token"] = _CacheEntry(
            value=None,  # we abuse the field — store token in a module-level var
            expires_at=time.monotonic() + ttl - 60,  # 60s safety margin
        )
        _token_cache["__token__"] = _CacheEntry(
            value=_StringWrapper(token),  # type: ignore[arg-type]
            expires_at=time.monotonic() + ttl - 60,
        )
        return token
    except httpx.HTTPError as exc:
        logger.error("INSEE token fetch failed: %s", exc)
        return None


class _StringWrapper:
    """Tiny wrapper so we can store a string in the CompanyInfo-typed cache."""
    def __init__(self, s: str):
        self.s = s


async def _get_access_token(client: httpx.AsyncClient) -> Optional[str]:
    cached = _token_cache.get("__token__")
    if cached and cached.expires_at > time.monotonic() and cached.value:
        return cached.value.s  # type: ignore[attr-defined]
    return await _fetch_fresh_token(client)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def lookup_siret(siret: str) -> Optional[CompanyInfo]:
    """
    Look up a SIRET in the INSEE SIRENE API.
    Returns a CompanyInfo on success, None on any error (network, auth, not found).
    """
    if _is_circuit_open():
        logger.warning("INSEE circuit breaker is OPEN — skipping lookup")
        return None

    cached = _response_cache.get(siret)
    if cached and cached.expires_at > time.monotonic():
        return cached.value

    await _check_rate_limit()

    url = f"{settings.insee_sirene_base}/siret/{siret}"

    for attempt in range(settings.insee_max_retries + 1):
        async with httpx.AsyncClient() as client:
            token = await _get_access_token(client)
            if token is None:
                _cache_response(siret, None)
                return None
            try:
                resp = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
                    timeout=settings.insee_request_timeout,
                )
                if resp.status_code == 404:
                    _cache_response(siret, None)
                    _record_success()
                    return None
                if resp.status_code == 429:
                    logger.warning("INSEE 429 — rate limited, backing off")
                    await asyncio.sleep(2 ** attempt)
                    continue
                resp.raise_for_status()
                _record_success()
                company = _parse_siret_response(resp.json())
                _cache_response(siret, company)
                return company
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code >= 500:
                    _record_failure()
                    if attempt < settings.insee_max_retries:
                        await asyncio.sleep(2 ** attempt)
                        continue
                logger.error("INSEE API error for %s: %s", siret, exc)
                _cache_response(siret, None)
                return None
            except httpx.HTTPError as exc:
                _record_failure()
                logger.error("INSEE network error for %s: %s", siret, exc)
                if attempt < settings.insee_max_retries:
                    await asyncio.sleep(2 ** attempt)
                    continue
                _cache_response(siret, None)
                return None
    return None


def _cache_response(siret: str, company: Optional[CompanyInfo]):
    _response_cache[siret] = _CacheEntry(
        value=company,
        expires_at=time.monotonic() + settings.insee_cache_ttl,
    )


def _parse_siret_response(data: dict) -> Optional[CompanyInfo]:
    """Parse the INSEE SIRENE v3 JSON response into a CompanyInfo."""
    try:
        etab = data["etablissement"]
        unite = etab.get("uniteLegale", {})

        # Denominations
        denomination = (
            unite.get("denominationUniteLegale")
            or f"{unite.get('prenom1UniteLegale', '')} {unite.get('nomUniteLegale', '')}".strip()
        )

        # Address
        adr = etab.get("adresseEtablissement", {})
        address_parts = filter(None, [
            adr.get("numeroVoieEtablissement"),
            adr.get("typeVoieEtablissement"),
            adr.get("libelleVoieEtablissement"),
            adr.get("codePostalEtablissement"),
            adr.get("libelleCommuneEtablissement"),
        ])
        address = " ".join(address_parts)

        etat = etab.get("periodesEtablissement", [{}])[0]
        is_active = etat.get("etatAdministratifEtablissement") == "A"

        return CompanyInfo(
            siren=etab["siren"],
            siret=etab["siret"],
            denomination=denomination,
            address=address,
            activity_code=etab.get("activitePrincipaleEtablissement"),
            activity_label=etab.get("activitePrincipaleRegistreMetiersEtablissement"),
            legal_form=unite.get("categorieJuridiqueUniteLegale"),
            is_active=is_active,
        )
    except (KeyError, IndexError, TypeError) as exc:
        logger.error("Failed to parse INSEE response: %s", exc)
        return None

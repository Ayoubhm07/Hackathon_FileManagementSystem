import React from 'react';
import { User, Shield, Bell, Moon } from 'lucide-react';
import { Card, PageHeader } from '../components/ui';
import keycloak from '../keycloak';

export function SettingsPage() {
  const username = keycloak.tokenParsed?.preferred_username ?? 'Utilisateur';
  const roles: string[] = keycloak.tokenParsed?.realm_access?.roles ?? [];
  const roleLabel = roles.includes('ROLE_ADMIN') ? 'Administrateur' : roles.includes('ROLE_VALIDATOR') ? 'Validateur' : 'Opérateur';

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Paramètres" subtitle="Préférences et configuration de votre compte" />

      <div className="grid grid-cols-2 gap-5">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <h3 className="font-semibold text-textprimary">Profil utilisateur</h3>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white text-xl font-bold">
              {username.slice(0,2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-textprimary">{username}</p>
              <p className="text-sm text-textsecondary">{username}@docflow.io</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full border border-primary/30">{roleLabel}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-purple/20 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-purple" />
            </div>
            <h3 className="font-semibold text-textprimary">Sécurité</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-textsecondary">Authentification</span>
              <span className="text-success flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full inline-block" /> Keycloak SSO</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textsecondary">Session</span>
              <span className="text-textprimary">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textsecondary">Rôle</span>
              <span className="text-textprimary">{roleLabel}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
              <Bell size={16} className="text-warning" />
            </div>
            <h3 className="font-semibold text-textprimary">Notifications</h3>
          </div>
          <div className="space-y-3">
            {['Alertes critiques', 'Traitement terminé', 'Échecs pipeline'].map(label => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-textsecondary">{label}</span>
                <div className="w-9 h-5 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

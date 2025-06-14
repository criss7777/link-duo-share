
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Link2, User, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header = () => {
  const { user, signOut } = useAuth();

  // Extract initials from email for avatar
  const getInitials = (email: string) => {
    if (email === 'user1@example.com') return 'KR';
    if (email === 'user2@example.com') return 'GL';
    return email.substring(0, 2).toUpperCase();
  };

  // Get display name
  const getDisplayName = (email: string) => {
    if (email === 'user1@example.com') return 'Kristi';
    if (email === 'user2@example.com') return 'Gledi';
    return email.split('@')[0];
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur-sm opacity-75" />
            <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
              <Link2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              LinkVault
            </h1>
            <p className="text-xs text-purple-300/70 -mt-1">Secure Workspace</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Avatar className="h-8 w-8 border-2 border-purple-400/50">
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                {getInitials(user?.email || '')}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="text-white font-medium">{getDisplayName(user?.email || '')}</p>
              <p className="text-purple-300/70 text-xs">{user?.email}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-400/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-xs font-medium">Online</span>
          </div>

          {/* Sign Out Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="flex items-center gap-2 bg-white/5 border-white/20 text-purple-200 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

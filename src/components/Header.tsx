
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Search, Star, Clock, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const Header = () => {
  const { user, signOut } = useAuth();

  const getInitials = (email: string) => {
    if (email === 'user1@example.com') return 'KR';
    if (email === 'user2@example.com') return 'GL';
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    if (email === 'user1@example.com') return 'Kristi';
    if (email === 'user2@example.com') return 'Gledi';
    return email.split('@')[0];
  };

  return (
    <header className="h-12 bg-[#350d36] flex items-center justify-between px-4 relative z-50 border-b border-[#5b2c5c]">
      {/* Left Section */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Workspace Name */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-white font-bold text-lg truncate">LinkVault</h1>
          <div className="w-2 h-2 bg-green-400 rounded-full" />
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search LinkVault"
              className="h-8 pl-10 bg-[#5b2c5c]/50 border-[#5b2c5c] text-white placeholder:text-slate-300 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Action Buttons */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Clock className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Star className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {/* User Section */}
        <div className="flex items-center gap-2 ml-2">
          <Avatar className="h-7 w-7 border border-white/20">
            <AvatarFallback className="bg-[#5b2c5c] text-white text-xs font-medium">
              {getInitials(user?.email || '')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-1">
            <span className="text-white text-sm font-medium hidden sm:block">
              {getDisplayName(user?.email || '')}
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full" />
          </div>
        </div>

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="h-8 px-2 text-white/70 hover:text-white hover:bg-white/10 ml-2"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;

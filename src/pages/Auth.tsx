
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Link2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    signIn,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const updateUserProfile = async (userId: string, email: string) => {
    let username = email; // Default fallback

    // Set specific usernames based on email
    if (email === 'user1@example.com') {
      username = 'Kristi';
    } else if (email === 'user2@example.com') {
      username = 'Gledi';
    }
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        username
      }).eq('id', userId);
      if (error) {
        console.error('Error updating profile:', error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        toast({
          title: "Access denied",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Get the current user after successful sign in
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          await updateUserProfile(user.id, email);
        }
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative">
      {/* Simplified background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #9C92AC 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      </div>
      
      <div className="w-full max-w-md relative">
        {/* Simplified Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-500 p-3 rounded-full">
              <Link2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            LinkVault
          </h1>
          <p className="text-purple-200 text-sm">Secure Link Management</p>
        </div>

        {/* Simplified Main Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-xl text-gray-800">
                Welcome Back
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Sign in to access your workspace
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 text-sm font-medium">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400" 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Simplified Footer */}
        <div className="text-center mt-6 text-purple-300/70 text-sm">
          <p>Secure • Encrypted • Private</p>
        </div>
      </div>
    </div>;
};

export default Auth;

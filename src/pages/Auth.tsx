import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      toast({
        title: "Registration unavailable",
        description: "Please contact your team lead for access credentials",
        variant: "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative">
      {/* Simple dot pattern background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #9C92AC 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      </div>
      
      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-75" />
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full">
                <Link2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-3">
            LinkVault
          </h1>
          <p className="text-purple-200/80 text-lg">End-to-End Encryption </p>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-300" />
              <CardTitle className="text-2xl font-bold text-white text-center">
                Welcome Back
              </CardTitle>
            </div>
            <CardDescription className="text-center text-purple-200/70">
              Access your secure workspace
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
                <TabsList className="relative grid w-full grid-cols-1 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-1 shadow-lg">
                  <TabsTrigger 
                    value="signin" 
                    className="relative h-12 rounded-xl font-semibold text-base transition-all duration-300
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 
                      data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25
                      data-[state=inactive]:text-purple-200 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/10
                      flex items-center justify-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Secure Access
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-purple-100">Email</Label>
                    <Input id="email" type="email" placeholder="your.email@company.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 bg-white/5 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-purple-100">Password</Label>
                    <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 bg-white/5 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400" />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 font-semibold" disabled={loading}>
                    {loading ? <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div> : <div className="flex items-center gap-2">
                        Access Workspace
                        <ArrowRight className="h-4 w-4" />
                      </div>}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-purple-100">Email</Label>
                    <Input id="signup-email" type="email" placeholder="your.email@company.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 bg-white/5 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-purple-100">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Create a secure password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 bg-white/5 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-purple-100">Confirm Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-12 bg-white/5 border-white/20 text-white placeholder:text-purple-300/50 focus:border-purple-400" />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 font-semibold" disabled={loading}>
                    {loading ? 'Creating account...' : 'Request Access'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Info Section */}
            
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-300/60 text-sm">
          <p>Powered by advanced security • Built for collaboration</p>
        </div>
      </div>
    </div>;
};

export default Auth;

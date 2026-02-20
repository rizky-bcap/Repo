import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                    Enter your email and password to access your dashboard.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                    <button
                        type="button"
                        onClick={async () => {
                            if (!email) {
                                setError('Please enter your email address first.');
                                return;
                            }
                            setLoading(true);
                            const siteUrl = window.location.hostname === 'localhost'
                                ? window.location.origin
                                : 'https://repo-bcap.vercel.app';

                            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                redirectTo: `${siteUrl}/reset-password`,
                            });
                            setLoading(false);
                            if (error) {
                                setError(error.message);
                            } else {
                                setError(null);
                                alert('Password reset email sent! Please check your inbox.');
                            }
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    >
                        Forgot password?
                    </button>
                </CardFooter>
            </form>
        </Card>
    );
}

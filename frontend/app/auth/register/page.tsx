/**
 * Register Page Component
 * Handles new user registration
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();

    // Form state
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        setLoading(true);

        try {
            // Call register function from auth context
            await register(username, password, fullName || undefined);

            // Redirect to home page on success
            router.push('/');
        } catch (err: any) {
            // Display error message
            const errorMessage = err.response?.data?.detail || 'Ошибка регистрации. Попробуйте другое имя пользователя.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Регистрация</CardTitle>
                    <CardDescription className="text-center">
                        Создайте новый аккаунт для доступа к системе
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {/* Error alert */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Username field */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Имя пользователя *</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Введите имя пользователя"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                                minLength={3}
                                className="w-full"
                            />
                        </div>

                        {/* Full name field */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Полное имя</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Введите полное имя (необязательно)"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={loading}
                                className="w-full"
                            />
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Пароль *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Минимум 6 символов"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                minLength={6}
                                className="w-full"
                            />
                        </div>

                        {/* Confirm password field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Повторите пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                minLength={6}
                                className="w-full"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        {/* Submit button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                        </Button>

                        {/* Login link */}
                        <p className="text-sm text-center text-gray-600">
                            Уже есть аккаунт?{' '}
                            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                                Войти
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

"use client";
import Image from 'next/image';
import Link from 'next/link';
import { signup, login } from './actions';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import validator from 'validator';

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen justify-evenly items-center px-4 overflow-hidden">

      {/* Background Image */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <img
          src="/vendorax_background.png"
          alt="Background"
          className="w-full h-full object-cover object-center"
        />
      </div>


      {/* First: Logo & Company Name */}
      <div className="flex flex-col items-center space-y-2">
        <Image
          src="/Vendorax_cleanlogo.png"
          alt="Vendor Ax Logo"
          width={120}
          height={120}
          className="object-contain"
        />
        <h1 className="text-3xl font-semibold text-gray-900">Vendor Ax</h1>
      </div>

      {/* Second: Welcome + Login */}
      <div className="w-full max-w-md space-y-4 px-6">
        
        <Card className="bg-white/50 backdrop-blur-md shadow-xl rounded-xl">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setErrorMessage('');

              if (!validator.isEmail(email)) {
                setEmailError('Please enter a valid email address');
                return;
              }

              setIsSubmitting(true);
            
              const formData = new FormData(e.currentTarget);
              try {
                await login(formData);
                router.push('/admin');
              } catch (err: any) {
                setErrorMessage(err.message || 'Login failed');
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <CardContent className="space-y-4 py-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Welcome back</h2>
                <p className="text-gray-600 mt-1">Enter your email and password</p>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="name@example.com"
                  className="mt-1"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(''); // clear error on typing
                  }}
                  required
                />
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" className="mt-1" required />
              </div>
              
              <Link href="#" className="text-sm text-gray-600" prefetch={false}>
                Forgot password?
              </Link>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-2 py-6 w-full">
              {errorMessage && (
                <p className="text-sm text-red-600 text-center">{errorMessage}</p>
              )}

              <div className="flex w-full gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-6 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin border-2 border-t-transparent border-white rounded-full" viewBox="0 0 24 24" />
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>
              </div>
            </CardFooter>

          </form>
        </Card>
      </div>

    </div>
  );
}

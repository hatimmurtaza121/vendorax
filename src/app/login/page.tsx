import Image from 'next/image';
import Link from 'next/link';
import { signup, login } from './actions';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 justify-evenly items-center px-4">

      {/* First: Logo & Company Name */}
      <div className="flex flex-col items-center space-y-2">
        <Image
          src="/Vendorax_cleanlogo.png"
          alt="Vendor Ax Logo"
          width={64}
          height={64}
          className="object-contain"
        />
        <h1 className="text-3xl font-semibold text-gray-900">Vendor Ax</h1>
      </div>

      {/* Second: Welcome + Login */}
      <div className="w-full max-w-md space-y-4 px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Welcome back</h2>
          <p className="text-gray-600 mt-1">Enter your email and password</p>
        </div>

        <Card>
          <form>
            <CardContent className="space-y-4 py-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" className="mt-1" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <Link href="#" className="text-sm text-gray-500" prefetch={false}>Forgot password?</Link>
              <div className="flex w-full sm:w-auto gap-4">
                <Button formAction={login} className="flex-1 py-2 px-6">Log in</Button>
                {/* <Button formAction={signup} variant="outline" className="flex-1 py-2 px-6">Sign up</Button> */}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

    </div>
  );
}

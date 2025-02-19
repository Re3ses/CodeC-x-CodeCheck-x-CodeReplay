import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from './ui/use-toast';
import { ChangePass } from '@/utilities/apiService';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

type PasswordFormData = {
  old: string;
  password: string;
  confirmPass: string;
};

const PASSWORD_MIN_LENGTH = 8;

export default function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordFormData>();

  const newPassword = watch('password');

  const validatePasswordMatch = (value: string) => {
    return value === newPassword || 'Passwords must match';
  };

  const validatePasswordLength = (value: string) => {
    return value.length >= PASSWORD_MIN_LENGTH || 
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  };

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await ChangePass(data.old, data.confirmPass);
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully. This will take effect after you log out or login to another session.',
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password. Please check your current password and try again.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old">Current Password</Label>
            <Input
              id="old"
              type="password"
              placeholder="Enter current password"
              {...register('old', { 
                required: 'Current password is required'
              })}
              aria-invalid={errors.old ? 'true' : 'false'}
            />
            {errors.old && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.old.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              {...register('password', {
                required: 'New password is required',
                validate: validatePasswordLength
              })}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPass">Confirm New Password</Label>
            <Input
              id="confirmPass"
              type="password"
              placeholder="Confirm new password"
              {...register('confirmPass', {
                required: 'Please confirm your new password',
                validate: validatePasswordMatch
              })}
              aria-invalid={errors.confirmPass ? 'true' : 'false'}
            />
            {errors.confirmPass && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.confirmPass.message}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
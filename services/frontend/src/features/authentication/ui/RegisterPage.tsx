import { LoadingButton } from '@mui/lab';
import { Box, Button, Card, Checkbox, Divider, FormControlLabel, FormHelperText } from '@mui/material';
import { SocialIconButton, TextFieldWrapper } from '@shared/ui/authentication';
import { FlexBox, H1, H3, LightTextField, Small } from '@shared/ui/components';
import { useAuth } from '@shared/lib/hooks';
import FacebookIcon from 'icons/FacebookIcon';
import GoogleIcon from 'icons/GoogleIcon';
import type { FC } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

type Props = {
  onSuccess: () => void;
};

export const RegisterPage: FC<Props> = ({ onSuccess }) => {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      terms: true,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (values: {
    email: string;
    password: string;
    name: string;
  }) => {
    setLoading(true);
    setError('');

    try {
      await registerUser(values.email, values.name, values.password);
      setLoading(false);
      onSuccess();
    } catch (caught: unknown) {
      const err = caught as { message?: string };
      setError(err?.message || 'Erro ao registrar');
      setLoading(false);
    }
  };

  return (
    <FlexBox
      sx={{
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        height: { sm: '100%' },
      }}
    >
      <Card sx={{ padding: 4, maxWidth: 600, boxShadow: 1 }}>
        <FlexBox
          alignItems="center"
          flexDirection="column"
          justifyContent="center"
          mb={5}
        >
          <Box width={38} mb={1}>
            <img src="/static/logo/logo.svg" width="100%" alt="Uko Logo" />
          </Box>
          <H1 fontSize={24} fontWeight={700}>
            Get started with Uko
          </H1>
        </FlexBox>

        <FlexBox justifyContent="space-between" flexWrap="wrap" my="1rem">
          <SocialIconButton
            startIcon={<GoogleIcon sx={{ mr: '0.5rem' }} />}
          >
            Sign up with Google
          </SocialIconButton>
          <SocialIconButton
            startIcon={<FacebookIcon sx={{ mr: '0.5rem' }} />}
          >
            Sign up with Facebook
          </SocialIconButton>

          <Divider sx={{ my: 3, width: '100%', alignItems: 'flex-start' }}>
            <H3 color="text.disabled" px={1}>
              Or
            </H3>
          </Divider>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            style={{ width: '100%' }}
          >
            <FlexBox justifyContent="space-between" flexWrap="wrap">
              <TextFieldWrapper>
                <LightTextField
                  fullWidth
                  type="text"
                  label="Name"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  {...register('name', {
                    required: 'Name is required',
                  })}
                />
              </TextFieldWrapper>

              <TextFieldWrapper>
                <LightTextField
                  fullWidth
                  type="email"
                  label="Email"
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Must be a valid email',
                    },
                  })}
                />
              </TextFieldWrapper>
            </FlexBox>

            <TextFieldWrapper sx={{ mt: 2, width: '100%' }}>
              <LightTextField
                fullWidth
                type="password"
                label="Password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password should be of minimum 6 characters length',
                  },
                })}
              />
            </TextFieldWrapper>

            <FormControlLabel
              control={
                <Checkbox
                  disableRipple
                  checked={watchedValues.terms}
                  {...register('terms')}
                />
              }
              label="I agree to terms & conditions"
              sx={{
                marginTop: '0.5rem',
                '& .MuiTypography-root': { fontWeight: 600 },
              }}
            />

            {error ? (
              <FormHelperText
                error
                sx={{
                  mt: 2,
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                {error}
              </FormHelperText>
            ) : null}

            <Box sx={{ mt: 4 }}>
              {loading ? (
                <LoadingButton loading fullWidth variant="contained">
                  Sign Up
                </LoadingButton>
              ) : (
                <Button fullWidth type="submit" variant="contained">
                  Sign Up
                </Button>
              )}
            </Box>
          </form>

          <Small margin="auto" mt={3} color="text.disabled">
            Do you already have an account?{' '}
            <Link to="/login">
              <Small color="primary.main">Log in</Small>
            </Link>
          </Small>
        </FlexBox>
      </Card>
    </FlexBox>
  );
};

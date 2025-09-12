import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Card,
  Divider,
  FormControlLabel,
  FormHelperText,
  Switch,
} from '@mui/material';
import { SocialIconButton, TextFieldWrapper } from '@shared/ui/authentication';
import {
  FlexBox,
  LightTextField,
  H1,
  H3,
  Paragraph,
  Small,
} from '@shared/ui/components';
import { useForm } from 'react-hook-form';
import { useAuth } from '@shared/lib/hooks';
import FacebookIcon from 'icons/FacebookIcon';
import GoogleIcon from 'icons/GoogleIcon';
import { FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Validação nativa do react-hook-form, sem dependências extras

const Login: FC = () => {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  let navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      email: 'demo@example.com',
      password: 'v&)3?2]:',
      remember: true,
    },
  });

  const watchedValues = watch();

  const onSubmit = (values: { email: string; password: string }) => {
    console.log('Login form submitted:', values);
    setLoading(true);
    setError('');
    
    login(values.email, values.password)
      .then(() => {
        setLoading(false);
        console.log('You Logged In Successfully test');
        navigate('/dashboard');
      })
      .catch((error) => {
        console.error('Login error:', error);
        setError(error.message || error);
        setLoading(false);
      });
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
            Sign In to Uko
          </H1>
        </FlexBox>

        <FlexBox justifyContent="space-between" flexWrap="wrap" my="1rem">
          <SocialIconButton
            // onClick={loginWithGoogle}
            startIcon={<GoogleIcon sx={{ mr: 1 }} />}
          >
            Sign in with Google
          </SocialIconButton>
          <SocialIconButton
            // onClick={loginWithFacebook}
            startIcon={<FacebookIcon sx={{ mr: 1 }} />}
          >
            Sign in with Facebook
          </SocialIconButton>

          <Divider sx={{ my: 3, width: '100%', alignItems: 'flex-start' }}>
            <H3 color="text.disabled" px={1}>
              Or
            </H3>
          </Divider>

          <form noValidate onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
            <FlexBox justifyContent="space-between" flexWrap="wrap">
              <TextFieldWrapper>
                <Paragraph fontWeight={600} mb={1}>
                  Email
                </Paragraph>
                <LightTextField
                  fullWidth
                  type="email"
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Must be a valid email'
                    }
                  })}
                />
              </TextFieldWrapper>

              <TextFieldWrapper>
                <Paragraph fontWeight={600} mb={1}>
                  Password
                </Paragraph>
                <LightTextField
                  fullWidth
                  type="password"
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password should be of minimum 6 characters length'
                    }
                  })}
                />
              </TextFieldWrapper>
            </FlexBox>

            <FlexBox mt={2} alignItems="center" justifyContent="space-between">
              <FormControlLabel
                control={
                  <Switch
                    checked={watchedValues.remember}
                    {...register('remember')}
                  />
                }
                label="Remember Me"
                sx={{ '& .MuiTypography-root': { fontWeight: 600 } }}
              />
              <Link to="/forget-password">
                <Small color="secondary.red">Forgot Password?</Small>
              </Link>
            </FlexBox>

            {error && (
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
            )}

            <Box sx={{ mt: 4 }}>
              {loading ? (
                <LoadingButton loading fullWidth variant="contained">
                  Sign In
                </LoadingButton>
              ) : (
                <Button fullWidth type="submit" variant="contained">
                  Sign In
                </Button>
              )}
            </Box>
          </form>

          <Small margin="auto" mt={3} color="text.disabled">
            Don't have an account?{' '}
            <Link to="/register">
              <Small color="primary.main">Create an account</Small>
            </Link>
          </Small>
        </FlexBox>
      </Card>
    </FlexBox>
  );
};

export default Login;

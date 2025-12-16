import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Card,
  FormControlLabel,
  FormHelperText,
  Switch,
  styled,
} from '@mui/material';
import {
  FlexBox,
  LightTextField,
  H1,
  Paragraph,
  Small,
} from '@shared/ui/components';
import { useForm } from 'react-hook-form';
import { useAuth } from '@shared/lib/hooks';
import { FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Styled component for the Logo (similar to sidebar)
const LogoIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '24px',
  fontWeight: 700,
  boxShadow: `0 4px 20px ${theme.palette.primary.main}40`,
  marginBottom: theme.spacing(2),
}));

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
        height: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Card
        sx={{
          padding: 4,
          maxWidth: 500,
          width: '100%',
          boxShadow: 2,
          '&:hover': {
            boxShadow: 2,
            transform: 'none',
          },
        }}
      >
        <FlexBox
          alignItems="center"
          flexDirection="column"
          justifyContent="center"
          mb={4}
        >
          <LogoIcon>RJ</LogoIcon>
          <H1 fontSize={24} fontWeight={700}>
            RJ Chronos
          </H1>
          <Paragraph color="text.secondary" mt={1}>
            Gerenciamento de OLTs e Provisionamento
          </Paragraph>
        </FlexBox>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          style={{ width: '100%' }}
        >
          <Box mb={2} sx={{ width: '100%' }}>
            <Paragraph fontWeight={600} mb={1}>
              Email
            </Paragraph>
            <LightTextField
              fullWidth
              type="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Deve ser um email válido',
                },
              })}
            />
          </Box>

          <Box mb={2} sx={{ width: '100%' }}>
            <Paragraph fontWeight={600} mb={1}>
              Senha
            </Paragraph>
            <LightTextField
              fullWidth
              type="password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'A senha deve ter no mínimo 6 caracteres',
                },
              })}
            />
          </Box>

          <FlexBox mt={2} alignItems="center" justifyContent="space-between">
            <FormControlLabel
              control={
                <Switch
                  checked={watchedValues.remember}
                  {...register('remember')}
                />
              }
              label="Lembrar-me"
              sx={{ '& .MuiTypography-root': { fontWeight: 600 } }}
            />
            <Link to="/forget-password">
              <Small color="secondary.red">Esqueceu a senha?</Small>
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
                Entrar
              </LoadingButton>
            ) : (
              <Button fullWidth type="submit" variant="contained">
                Entrar
              </Button>
            )}
          </Box>
        </form>

        {/* <Small margin="auto" mt={3} color="text.disabled">
            Não tem uma conta?{' '}
            <Link to="/register">
              <Small color="primary.main">Criar uma conta</Small>
            </Link>
          </Small> */}
      </Card>
    </FlexBox>
  );
};

export default Login;

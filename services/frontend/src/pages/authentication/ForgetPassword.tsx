import { LoadingButton } from '@mui/lab';
import { Box, Button, Card, FormHelperText } from '@mui/material';
import { FlexBox, LightTextField, H1, Small } from '@shared/ui/components';
import { useForm } from 'react-hook-form';
import { FC, useState } from 'react';
import { Link } from 'react-router-dom';

const ForgetPassword: FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'demo@example.com',
    },
  });

  const onSubmit = (_values: { email: string }) => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      console.log('Reset link has been sent!');
    }, 1000);

    if (error) {
      setError('Error!');
      setLoading(false);
    }
  };

  return (
    <FlexBox
      height="100vh"
      alignItems="center"
      flexDirection="column"
      justifyContent="center"
    >
      <Card sx={{ padding: 4, maxWidth: 600, marginTop: 4, boxShadow: 1 }}>
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
            Reset your password
          </H1>
        </FlexBox>

        <FlexBox justifyContent="space-between" flexWrap="wrap" my={2}>
          <form noValidate onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
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
                  message: 'Must be a valid email'
                }
              })}
            />

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
                  Reset
                </LoadingButton>
              ) : (
                <Button fullWidth type="submit" variant="contained">
                  Reset
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

export default ForgetPassword;

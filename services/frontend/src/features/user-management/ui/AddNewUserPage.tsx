import { PhotoCamera } from '@mui/icons-material';
import { alpha, Box, Button, Card, Grid, IconButton, styled, Switch } from '@mui/material';
import LightTextField from '@shared/ui/components/LightTextField';
import { Small, Tiny } from '@shared/ui/components/Typography';
import type { FC } from 'react';
import { useForm } from 'react-hook-form';

const ButtonWrapper = styled(Box)(({ theme }) => ({
  width: 100,
  height: 100,
  display: 'flex',
  borderRadius: '50%',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor:
    theme.palette.mode === 'light'
      ? theme.palette.secondary[200]
      : alpha(theme.palette.primary[100], 0.1),
}));

const UploadButton = styled(Box)(({ theme }) => ({
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  border: '2px solid',
  alignItems: 'center',
  justifyContent: 'center',
  borderColor: theme.palette.background.paper,
  backgroundColor:
    theme.palette.mode === 'light'
      ? theme.palette.secondary[400]
      : alpha(theme.palette.background.paper, 0.9),
}));

const SwitchWrapper = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  marginTop: 10,
}));

export const AddNewUserPage: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      country: '',
      state: '',
      city: '',
      address: '',
      zip: '',
      about: '',
    },
  });

  const onSubmit = (data: unknown) => {
    console.log('Form submitted:', data);
  };

  return (
    <Box pt={2} pb={4}>
      <Card sx={{ padding: 4 }}>
        <Grid container spacing={3}>
          <Grid item md={4} xs={12}>
            <Card
              sx={{
                padding: 3,
                boxShadow: 2,
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <ButtonWrapper>
                <UploadButton>
                  <label htmlFor="upload-btn">
                    <input
                      accept="image/*"
                      id="upload-btn"
                      type="file"
                      style={{ display: 'none' }}
                    />
                    <IconButton component="span">
                      <PhotoCamera sx={{ fontSize: 26, color: 'white' }} />
                    </IconButton>
                  </label>
                </UploadButton>
              </ButtonWrapper>

              <Small
                marginTop={2}
                maxWidth={200}
                lineHeight={1.9}
                display="block"
                textAlign="center"
                color="text.disabled"
              >
                Allowed *.jpeg, *.jpg, *.png, *.gif max size of 3.1 MB
              </Small>

              <Box maxWidth={250} marginTop={5} marginBottom={1}>
                <SwitchWrapper>
                  <Small display="block" fontWeight={600}>
                    Public Profile
                  </Small>
                  <Switch defaultChecked />
                </SwitchWrapper>

                <SwitchWrapper>
                  <Small display="block" fontWeight={600}>
                    Banned
                  </Small>
                  <Switch defaultChecked />
                </SwitchWrapper>
                <Tiny display="block" color="text.disabled" fontWeight={500}>
                  Apply disable account
                </Tiny>

                <SwitchWrapper>
                  <Small display="block" fontWeight={600}>
                    Email Verified
                  </Small>
                  <Switch defaultChecked />
                </SwitchWrapper>
                <Tiny display="block" color="text.disabled" fontWeight={500}>
                  Disabling this will automatically send the user a verification
                  email
                </Tiny>
              </Box>
            </Card>
          </Grid>
          <Grid item md={8} xs={12}>
            <Card sx={{ padding: 3, boxShadow: 2 }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid item sm={6} xs={12}>
                    <LightTextField
                      fullWidth
                      placeholder="Full Name"
                      error={Boolean(errors.fullName)}
                      helperText={errors.fullName?.message}
                      {...register('fullName', {
                        required: 'Name is Required!',
                      })}
                    />
                  </Grid>

                  <Grid item sm={6} xs={12}>
                    <LightTextField
                      fullWidth
                      placeholder="Email Address"
                      error={Boolean(errors.email)}
                      helperText={errors.email?.message}
                      {...register('email', {
                        required: 'Email is Required!',
                        pattern: {
                          value:
                            /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i,
                          message: 'Must be a valid email',
                        },
                      })}
                    />
                  </Grid>

                  <Grid item sm={6} xs={12}>
                    <LightTextField
                      fullWidth
                      placeholder="Phone Number"
                      error={Boolean(errors.phone)}
                      helperText={errors.phone?.message}
                      {...register('phone', {
                        required: 'Phone is Required!',
                        minLength: {
                          value: 8,
                          message: 'Phone must be at least 8 characters',
                        },
                      })}
                    />
                  </Grid>

                  <Grid item sm={6} xs={12}>
                    <LightTextField
                      fullWidth
                      placeholder="Country"
                      error={Boolean(errors.country)}
                      helperText={errors.country?.message}
                      {...register('country', {
                        required: 'Country is Required!',
                      })}
                    />
                  </Grid>

                  <Grid item sm={6} xs={12}>
                    <LightTextField
                      fullWidth
                      placeholder="State/Region"
                      error={Boolean(errors.state)}
                      helperText={errors.state?.message}
                      {...register('state', {
                        required: 'State is Required!',
                      })}
                    />
                  </Grid>

                  <Grid item sm={6} xs={12}>
                    <LightTextField
                      fullWidth
                      placeholder="City"
                      error={Boolean(errors.city)}
                      helperText={errors.city?.message}
                      {...register('city', {
                        required: 'City is Required!',
                      })}
                    />
                  </Grid>

                  <Grid item sm={6} xs={12}>
                    <LightTextField
                      fullWidth
                      placeholder="Address"
                      error={Boolean(errors.address)}
                      helperText={errors.address?.message}
                      {...register('address', {
                        required: 'Address is Required!',
                      })}
                    />
                  </Grid>

                  <Grid item sm={6} xs={12}>
                    <LightTextField
                      fullWidth
                      placeholder="Zip/Code"
                      error={Boolean(errors.zip)}
                      helperText={errors.zip?.message}
                      {...register('zip', {
                        required: 'Zip is Required!',
                      })}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <LightTextField
                      multiline
                      fullWidth
                      rows={10}
                      placeholder="About"
                      error={Boolean(errors.about)}
                      helperText={errors.about?.message}
                      sx={{
                        '& .MuiOutlinedInput-root textarea': { padding: 0 },
                      }}
                      {...register('about', {
                        required: 'About is Required!',
                      })}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button type="submit" variant="contained">
                      Create User
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Card>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

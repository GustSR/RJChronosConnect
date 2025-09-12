import { TabContext, TabList } from '@mui/lab';
import { Box, Card, Grid, Tab } from '@mui/material';
import { FC, useState } from 'react';
// TODO: Implementar lightbox com biblioteca compatível do template Uko

const Gallery: FC = () => {
  const [value, setValue] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  // LightBox temporariamente desabilitado

  const filtered = itemData.filter((item) =>
    value ? item.category.includes(value) : item
  );

  const images = itemData.map((item) => item.img);

  const handleImageClick = (imgLink: string) => () => {
    // TODO: Implementar modal de imagem
    console.log('Image clicked:', imgLink);
  };

  return (
    <Card>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginY: 2 }}>
          <TabList
            onChange={(e, newValue) => setValue(newValue)}
            sx={{
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center',
              },
            }}
          >
            <Tab label="All" value="" />
            <Tab label="Branding" value="branding" />
            <Tab label="Fashion" value="fashion" />
            <Tab label="Development" value="development" />
          </TabList>
        </Box>
      </TabContext>
      <Grid container spacing={2} my={2} px={2}>
        {filtered.map((item) => (
          <Grid item md={3} xs={4} key={item.img}>
            <img
              src={item.img}
              alt={item.title}
              onClick={handleImageClick(item.img)}
              width="100%"
              height="100%"
              style={{ cursor: 'pointer' }}
            />
          </Grid>
        ))}
      </Grid>
      {/* TODO: Implementar lightbox com biblioteca compatível */}
    </Card>
  );
};

const itemData = [
  {
    img: '/static/post-image/post-1.png',
    title: 'Breakfast',
    category: ['branding', 'fashion'],
  },
  {
    img: '/static/post-image/post-2.png',
    title: 'Burger',
    category: ['branding', 'fashion'],
  },
  {
    img: '/static/post-image/post-3.png',
    title: 'Camera',
    category: ['branding', 'development'],
  },
  {
    img: '/static/post-image/post-4.png',
    title: 'Coffee',
    category: ['fashion'],
  },
  {
    img: '/static/post-image/post-5.png',
    title: 'Hats',
    category: ['development'],
  },
];

export default Gallery;

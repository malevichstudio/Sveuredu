import { Chip, CircularProgress, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import ChipsList from '@/components/ChipsList';
import Container from '@/components/Container';
import { Meta } from '@/components/Meta';
import ModalComponent from '@/components/Modal';
import Provider from '@/components/Provider';
import Search from '@/components/Search';
import ServiceCatalog from '@/components/ServiceCatalog';
import Breadcrumbs from '@/components/UI/Breadcrumbs';
import { ControlCheckbox } from '@/components/UI/Checkbox';
import Divider from '@/components/UI/Divider';
import Pagination from '@/components/UI/Pagination';
import { ROUTES } from '@/constants/constants';
import createApolloClient from '@/graphql/clientServerSide';
import { GET_CATEGORY_BY_SLUG, GET_SERVICES } from '@/graphql/queries';
import { GET_SUBCATEGORY_BY_SLUG } from '@/graphql/queries/getSubcategoryBySlug.gql';
import { useAuth, useImageZoom, useMediaHook } from '@/hooks';
import { useLoadingNavigation } from '@/hooks/useLoadingNavigation';
import CloseIcon from '@/icons/CloseIcon';
import FilterIcon from '@/icons/FilterIcon';
import deleteIcon from '@/images/deleteIcon.svg';
import palette from '@/theme/palette';
import { alphabeticalSorting } from '@/utils/alphabeticalSorting';
import {
  getCorrectObjectFromArray,
  getNameFromTranslations,
  getObjectNameAndIdFromArray,
} from '@/utils/getDifferentFormatOfData';
import { getMetaForService } from '@/utils/getMetaForService';

import {
  CategoriesList,
  FilterList,
  FiltersForm,
  ProvidersList,
  StyledCatalog,
  StyledDrawer,
  StyledFilterButton,
  StyledH1,
  StyledTopAction,
  Wrapper,
} from './styles';

const ServicePage = ({ servicesData, category, subCategoryBySlugMetaData }) => {
  const router = useRouter();

  const metatagsDataForCommon = category?.getCategoryBySlug?.metatags;
  const metatagsDataForOne = subCategoryBySlugMetaData?.getSubcategoryBySlug?.metatags;
  const metaDataFinite = metatagsDataForOne || metatagsDataForCommon;

  const { title, description, keywords } = getMetaForService(metaDataFinite, router.locale);

  const slugAry = router.query?.service;
  const subStr = router.query?.sub;
  const categorySlug = slugAry?.[0];
  const subcategorySlugs = subStr ? [subStr] : [];

  const { isDesktop, isMobile } = useMediaHook();
  const { isAuth } = useAuth();
  const { t, i18n } = useTranslation();
  const { loadingNavigation } = useLoadingNavigation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState();
  const [modalType, setModalType] = useState('createOrder');
  const [initialRender, setInitialRender] = useState(true);

  const [subcategories, setSubcategories] = useState();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { control, watch, setValue } = useForm({
    defaultValues: {
      categories: [],
    },
  });
  const filteredCategories = watch('categories');

  const categoryName = getNameFromTranslations(category?.getCategoryBySlug?.translations, i18n);
  const { handleZoomImage } = useImageZoom(setIsModalOpen, setModalType, setModalData);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalData({});
  };

  useEffect(() => {
    if (initialRender) {
      setInitialRender(false);
    }
  }, [initialRender]);

  useEffect(() => {
    const correctLocaleNames = getCorrectObjectFromArray(
      category?.getCategoryBySlug?.subcategories,
      i18n,
    );

    if (subcategorySlugs.length > 0) {
      const selected = correctLocaleNames?.filter((item) =>
        subcategorySlugs?.[0]?.split('-')?.includes(item.slug),
      );
      setValue('categories', selected);
    }
    setSubcategories(category?.getCategoryBySlug?.subcategories);
  }, [router.locale, category]);

  const [searchParametersLoaded, setSearchParametersLoaded] = useState(false);

  useEffect(() => {
    if (filteredCategories) setSearchParametersLoaded(true);
  });

  useEffect(() => {
    const shouldUpdateSearchParameters = searchParametersLoaded && filteredCategories.length > 0;
    const shouldResetSearchParameters =
      searchParametersLoaded && filteredCategories && filteredCategories.length === 0;
    const newPath = router.asPath.split('?')[0];

    if (shouldUpdateSearchParameters) {
      const selected = category?.getCategoryBySlug?.subcategories?.filter((subCat) => {
        return filteredCategories?.some((selectedCat) => selectedCat.id === subCat.id);
      });

      if (!router.query.sub && !loadingNavigation) {
        router.replace({
          pathname: router.asPath.split('?')[0],
          query: {
            sub: selected?.map((it) => it.slug),
          },
        });
      } else {
        router.replace({
          pathname: newPath,
          query: {
            sub: selected?.map((it) => it.slug).join('-'),
          },
        });
      }
    } else if (shouldResetSearchParameters && router.asPath !== newPath) {
      router.push({
        pathname: newPath,
      });
    }
  }, [filteredCategories.length]);

  const handleDelete = (chipToDelete) => {
    setValue(
      'categories',
      filteredCategories.filter((itemCategory) => {
        return itemCategory.id !== chipToDelete;
      }),
    );
  };

  const toggleDrawer = (value) => {
    setIsFilterOpen(value);
  };

  const filtersForm = () => (
    <FiltersForm>
      <Box
        justifyContent={'space-between'}
        alignItems={'center'}
        sx={{
          display: {
            xs: 'none',
            lg: 'flex',
          },
        }}
      >
        <Typography variant={'h5'}>{categoryName}</Typography>
      </Box>
      <Divider margin={'10px 0 15px'} />
      {isDesktop && filteredCategories?.length > 0 && (
        <>
          <FilterList>
            {filteredCategories.map(({ id, name }) => (
              <Chip
                key={id}
                deleteIcon={<Image src={deleteIcon} alt={'remove'} />}
                label={name}
                onDelete={() => handleDelete(id)}
              />
            ))}
          </FilterList>
          <Divider margin={'3px 0 10px'} />
        </>
      )}
      {subcategories && (
        <CategoriesList>
          <ControlCheckbox
            options={getObjectNameAndIdFromArray(
              alphabeticalSorting(subcategories, (sub) => sub.translations, router.locale),
              i18n,
            )}
            control={control}
            name={'categories'}
            margin={'0 0 14px 0'}
          />
        </CategoriesList>
      )}
    </FiltersForm>
  );

  // * ==================== START PAGINATION ===========================

  const ordersPerPageForServicesData = 10;
  const ordersCounter = servicesData.getServices?.count;

  const getPageInPagination = () => {
    if (router.query?.offset >= ordersPerPageForServicesData) {
      return Math.ceil(router.query?.offset / ordersPerPageForServicesData + 1);
    }
    return 1;
  };

  const page = getPageInPagination();

  const onChangeHandler = (event, value) => {
    const [updatedUrl, subSliceUrl] = router.asPath.split('?');
    let offset = router.query?.offset || 0;
    if (value <= 1) {
      offset = 0;
    } else {
      offset = value * ordersPerPageForServicesData - ordersPerPageForServicesData;
    }

    if (!router.query?.sub) {
      router.push({
        pathname: updatedUrl,
        ...(offset && {
          query: `offset=${offset}`,
        }),
      });
    } else {
      router.push({
        pathname: updatedUrl,
        query: {
          sub: subSliceUrl.split('=')[1].split('&')[0],
          ...(offset && {
            offset,
          }),
        },
      });
    }
  };

  // * ============================== END PAGINATION ====================================

  return (
    <>
      <Meta
        title={title || t('metaTitle')}
        contentKeywords={keywords || t('metaKeyWords')}
        contentDescriptions={description || t('metaHomeDescription')}
      />
      <>
        {!categorySlug ? (
          <StyledCatalog>
            <Container>
              <Box>
                <Breadcrumbs title={'home'} url={'/'} />
                <StyledH1 variant='h1'>{t('catalog')}</StyledH1>
              </Box>
            </Container>
            <Search />
            <ServiceCatalog withDivider={true} className={'catalog-page'} />
          </StyledCatalog>
        ) : (
          <>
            <Container direction='column'>
              <StyledTopAction>
                <Breadcrumbs
                  title={'allServices'}
                  url={`${ROUTES.categoryList}?category=${categorySlug}`}
                />
                <StyledFilterButton
                  className={isFilterOpen && 'closeBtn'}
                  onClick={() => toggleDrawer(!isFilterOpen)}
                >
                  {isFilterOpen ? <CloseIcon /> : <FilterIcon />}
                </StyledFilterButton>
              </StyledTopAction>
              <StyledH1 variant='h1'>{categoryName}</StyledH1>
              {!isDesktop && filteredCategories?.length > 0 && (
                <>
                  <FilterList>
                    {isMobile ? (
                      <ChipsList
                        chipsArr={filteredCategories}
                        withDeleteButton
                        handleDelete={handleDelete}
                        margin={'4px 0 0'}
                      />
                    ) : (
                      filteredCategories.map(({ id, name }) => (
                        <Chip
                          key={id}
                          deleteIcon={<Image src={deleteIcon} alt={'remove'} />}
                          label={name}
                          onDelete={() => handleDelete(id)}
                        />
                      ))
                    )}
                  </FilterList>
                </>
              )}
              <Wrapper>
                <ProvidersList>
                  {loadingNavigation ? (
                    <Box p={'10px'} display='flex' justifyContent={'center'}>
                      <CircularProgress
                        sx={{
                          color: palette.primary,
                        }}
                      />
                    </Box>
                  ) : servicesData?.getServices?.rows?.length > 0 ? (
                    servicesData?.getServices?.rows?.map((provider) => (
                      <Provider
                        {...provider}
                        serviceId={provider.id}
                        userId={provider.user.id}
                        isFavourite={!!provider?.inFavorites}
                        key={provider.id}
                        isAuth={isAuth}
                        setModalData={setModalData}
                        setIsModalOpen={setIsModalOpen}
                        setModalType={setModalType}
                        handleZoomImage={handleZoomImage}
                      />
                    ))
                  ) : (
                    <Typography variant={'h4'}>
                      {t('currentlyNoSpecialistWhoProvideService')}
                    </Typography>
                  )}
                  {!loadingNavigation && (
                    <Pagination
                      sx={{
                        margin: '10px 0',
                      }}
                      onChange={onChangeHandler}
                      elementsCount={ordersCounter}
                      ordersPerPage={ordersPerPageForServicesData}
                      page={page}
                    />
                  )}
                </ProvidersList>
                {isDesktop && slugAry?.length === 1 && filtersForm()}
              </Wrapper>
              <StyledDrawer
                anchor={'right'}
                open={isFilterOpen}
                onClose={() => toggleDrawer(false)}
              >
                {isMobile && filtersForm()}
              </StyledDrawer>
            </Container>
            <ModalComponent
              type={modalType}
              open={isModalOpen}
              handleClose={handleCloseModal}
              modalData={modalData}
            />
          </>
        )}
      </>
    </>
  );
};

export default ServicePage;

export const getServerSideProps = async (ctx) => {
  const { locale, query } = ctx;

  const slugAry = query?.service;
  const subStr = query?.sub;
  const categorySlug = slugAry?.[0];
  const subcategorySlugs = subStr ? [subStr] : [];

  const parametersForGetServices =
    categorySlug && subcategorySlugs.length > 0
      ? {
          categorySlug,
          subcategorySlugs: subcategorySlugs?.[0]?.split('-'),
        }
      : {
          categorySlug,
          ...(query?.service?.[1] && {
            subcategorySlugs: query?.service[1],
          }),
        };

  const offset = query?.offset;

  try {
    const { data: servicesData } = await createApolloClient(ctx).query({
      query: GET_SERVICES,
      variables: {
        ...parametersForGetServices,
        limit: 10,
        offset: +offset || 0,
      },
      skip: !categorySlug,
      fetchPolicy: 'network-only',
    });

    const { data: category } = await createApolloClient(ctx).query({
      query: GET_CATEGORY_BY_SLUG(false),
      variables: {
        slug: String(categorySlug),
      },
    });

    const { data: subCategoryBySlugMetaData } = await createApolloClient(ctx).query({
      query: GET_SUBCATEGORY_BY_SLUG,
      variables: {
        parentCategorySlug: categorySlug || 'freelancers',
        slug: String(slugAry?.[1]),
      },
    });

    return {
      props: {
        ...(await serverSideTranslations(locale ?? 'sr')),
        servicesData,
        category,
        subCategoryBySlugMetaData,
      },
    };
  } catch {
    return {
      notFound: true,
    };
  }
};

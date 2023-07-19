import { Typography, useMediaQuery } from '@mui/material';
import { Box } from '@mui/system';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect, useRef, useState } from 'react';

import ChipsList from '@/components/ChipsList';
import Container from '@/components/Container';
import DefaultImage from '@/components/DefaultImage';
import MessageToUnregisteredUser from '@/components/MessageToUnregisteredUser';
import { Meta } from '@/components/Meta';
import ModalComponent from '@/components/Modal';
import {
  TabComments,
  TabContacts,
  TabServiceCertificates,
  TabServicePhotos,
} from '@/components/Tabs/TabsForMasterPage';
import Breadcrumbs from '@/components/UI/Breadcrumbs';
import Button from '@/components/UI/Button';
import Divider from '@/components/UI/Divider';
import Dot from '@/components/UI/Dot';
import BasicTabs from '@/components/UI/Tabs';
import { HOST_IMAGE_URL, PROVIDER_PAGE_TAB, ROUTES } from '@/constants/constants';
import createApolloClient from '@/graphql/clientServerSide';
import { useSetFavouriteProvider } from '@/graphql/hooks/useMutations';
import { useGetLocales, useGetReviews } from '@/graphql/hooks/useQueries';
import { GET_FAVOURITE_SERVICES, GET_SERVICE, GET_SERVICES } from '@/graphql/queries';
import { useAuth, useImageZoom, useToast } from '@/hooks';
import EmptyStarIcon from '@/icons/EmptyStarIcon';
import HeartFillIcon from '@/icons/HeartFillIcon';
import HeartIcon from '@/icons/HeartIcon';
import StarIcon from '@/icons/StarIcon';
import theme from '@/theme';
import { convertToMinutes } from '@/utils/convert';
import {
  getNameFromTranslations,
  transformLocalesToObjectWithUserData,
} from '@/utils/getDifferentFormatOfData';
import { removeEmptyTab } from '@/utils/removeEmptyTab';

import {
  Addition,
  Avatar,
  BlockSubTitle,
  BlockTitle,
  CenteredText,
  CenteredTypography,
  ColumnWrapper,
  ConnectionBlock,
  DesktopTitle,
  FavouriteIconBlock,
  MobileTitle,
  ProviderItem,
  StyledBlock,
  StyledButtonText,
  StyledLink,
  StyledRating,
  StyledRatingWrap,
  UpperPart,
} from './styles';

const Master = ({ data: providerData, title }) => {
  const { data: locales } = useGetLocales();

  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t, i18n } = useTranslation();
  const { isAuth, userInfo } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('createReview');
  const [modalData, setModalData] = useState();
  const [initialTab, setInitialTab] = useState();
  const [isFavoirite, setIsFavoirite] = useState(providerData.getService.inFavorites);
  const [variant, setToastConfig] = useToast();

  const provider = providerData?.getService;

  const { data: arrayOfReviews, loading: reviewsLoading } = useGetReviews({
    variables: {
      userId: provider?.user?.id,
    },
    skip: !provider,
  });

  const reviews = arrayOfReviews?.getReviews?.rows;

  const [setFavourite] = useSetFavouriteProvider({
    onError: () => {
      setIsFavoirite(!isFavoirite);
      setToastConfig(variant.error);
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalData({});
  };
  const reviewsReference = useRef(null);

  const showBooking = () => {
    if (userInfo.role === 'USER' && provider?.enableBooking) {
      setIsModalOpen(true);
      setModalType('createOrder');
      setModalData({
        serviceId: provider?.id,
        userId: provider?.user?.id,
        provider,
      });
    }
  };

  const { handleZoomImage } = useImageZoom(setIsModalOpen, setModalType, setModalData);

  const autoScrollToReviews = router?.query?.reviews !== null;
  const autoScrollToContacts = router?.query?.contacts !== null;

  const isPhotosHidden = provider?.servicePhotos?.length < 1;
  const isCertificatesHidden = provider?.certificatePhotos?.length < 1;

  const nameOfHiddenTabs =
    isPhotosHidden && isCertificatesHidden
      ? ['photos', 'certificates']
      : isPhotosHidden
      ? ['photos']
      : isCertificatesHidden
      ? ['certificates']
      : [];

  const scrollToReviews = (reference) => {
    reference?.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const handleOpenModal = () => {
    setModalData({
      userId: provider?.user?.id,
      provider,
    });
    setIsModalOpen(true);
    return isAuth && userInfo?.firstName
      ? setModalType('createReview')
      : isAuth && !userInfo?.firstName
      ? setModalType('needUserDetails')
      : setModalType('needLogin');
  };

  const handleToggleFavourite = () => {
    setIsFavoirite(!isFavoirite);
    setFavourite({
      variables: {
        serviceId: provider?.id,
      },
      refetchQueries: [GET_FAVOURITE_SERVICES, GET_SERVICES],
    });
  };

  useEffect(() => {
    if (autoScrollToReviews && reviewsReference.current) {
      scrollToReviews(reviewsReference);
    }
  }, [autoScrollToReviews, reviewsReference, reviewsLoading]);

  useEffect(() => {
    if (autoScrollToContacts) {
      setInitialTab('contacts');
    }
  }, [autoScrollToContacts]);

  return (
    <Container direction='column'>
      <Meta
        title={title}
        contentDescriptions={t('metaGeneralDescription')}
        contentKeywords={t('metaKeyWords')}
      />
      <Breadcrumbs
        title={getNameFromTranslations(provider?.category?.translations, i18n)}
        url={`${ROUTES.service}/${provider?.category?.slug}`}
      />
      <>
        <ProviderItem>
          <UpperPart>
            <MobileTitle variant={'h4'}>
              {`${provider?.user?.firstName} ${provider?.user?.lastName}`}{' '}
              <StyledLink href={`${ROUTES.providerServices}/${provider?.user?.id}`}>
                {t('allMasterServices')}
              </StyledLink>
              <Divider margin={'10px 0'} />
            </MobileTitle>
            <ColumnWrapper className={'center leftColumn'}>
              <Avatar>
                {provider?.user?.photo ? (
                  <Image
                    src={`${HOST_IMAGE_URL}/${provider?.user?.photo}`}
                    alt={`${provider?.user?.firstName} ${provider?.user?.lastName}`}
                    fill
                    sizes={'auto'}
                    priority
                  />
                ) : (
                  <DefaultImage className={'big'} />
                )}
              </Avatar>
              <Box
                display={'flex'}
                alignItems={'center'}
                justifyContent={'space-between'}
                width={'216px'}
              >
                <StyledRatingWrap>
                  <StyledRating
                    name='read-only'
                    value={+provider?.user?.reviewsStatistic?.average?.toFixed(1)}
                    readOnly
                    icon={<StarIcon />}
                    emptyIcon={<EmptyStarIcon />}
                    precision={0.1}
                  />
                  <CenteredTypography variant={'caption'} component={'div'}>
                    <CenteredText>
                      <span>
                        {provider?.user?.reviewsStatistic?.average?.toFixed(1) || t('noRating')}
                      </span>
                    </CenteredText>
                    <Dot />
                    <StyledButtonText
                      type={'button'}
                      onClick={() => scrollToReviews(reviewsReference)}
                    >
                      <CenteredText>
                        {provider?.user?.reviewsStatistic?.count || 0}{' '}
                        {t('endingOfComments', {
                          count: provider?.user?.reviewsStatistic?.count || 0,
                        })}
                      </CenteredText>
                    </StyledButtonText>
                  </CenteredTypography>
                </StyledRatingWrap>
                {userInfo?.role === 'USER' && (
                  <FavouriteIconBlock
                    sx={{
                      cursor: 'pointer',
                    }}
                    onClick={handleToggleFavourite}
                  >
                    {isFavoirite ? <HeartFillIcon /> : <HeartIcon />}
                  </FavouriteIconBlock>
                )}
              </Box>
              {isMobile && provider?.price && (
                <>
                  <Box width={'100%'}>
                    <Divider margin={'10px 0'} />
                    <BlockTitle>{t('serviceDescription')}</BlockTitle>
                    <Typography>
                      {
                        transformLocalesToObjectWithUserData(
                          locales?.getLocales,
                          provider?.translations,
                        )?.[router.locale]?.userTranslate?.description
                      }
                    </Typography>
                    <Typography>
                      {`${t('priceFrom')}: ${provider?.price} ${t(provider?.currencyCode)} / ${
                        Number.isNaN(+provider.pricePer)
                          ? t(provider.pricePer)
                          : convertToMinutes(provider.pricePer, t)
                      }`}
                    </Typography>
                    <Divider margin={'10px 0'} />
                  </Box>
                  {provider?.subservices.map((subservice, index) => {
                    return (
                      <Box width={'100%'} key={index}>
                        <Typography>
                          {
                            transformLocalesToObjectWithUserData(
                              locales?.getLocales,
                              subservice?.translations,
                            )?.[router.locale]?.userTranslate?.description
                          }
                        </Typography>
                        <Typography>
                          {`${t('priceFrom')}: ${subservice?.price} ${t(
                            subservice?.currencyCode,
                          )}/${
                            Number.isNaN(+subservice.pricePer)
                              ? t(subservice.pricePer)
                              : convertToMinutes(subservice.pricePer, t)
                          }`}
                        </Typography>
                        {index !== provider?.subservices.length - 1 && (
                          <Divider margin={'10px 0'} />
                        )}
                      </Box>
                    );
                  })}
                </>
              )}
            </ColumnWrapper>
            <ColumnWrapper>
              <DesktopTitle variant={'h4'}>
                {`${provider?.user?.firstName} ${provider?.user?.lastName}`}{' '}
                <StyledLink href={`${ROUTES.providerServices}/${provider?.user?.id}`}>
                  {t('allMasterServices')}
                </StyledLink>
              </DesktopTitle>
              <Divider margin={'10px 0'} />
              {userInfo?.role !== 'PROVIDER' && provider?.enableBooking && (
                <ConnectionBlock>
                  {userInfo ? (
                    <Button
                      title={t('bookServiceOnline')}
                      className={'sm fullWidth'}
                      margin={'16px 0 0 0'}
                      onClickButton={showBooking}
                    />
                  ) : (
                    <>
                      <MessageToUnregisteredUser
                        margin={'15px 0 0'}
                        nameOfUnavailableBlock={'onlineBookings'}
                      />
                    </>
                  )}
                </ConnectionBlock>
              )}
              {!isMobile && provider?.price && (
                <>
                  <StyledBlock>
                    <BlockTitle>{t('serviceDescription')}</BlockTitle>
                    <Typography>
                      {
                        transformLocalesToObjectWithUserData(
                          locales?.getLocales,
                          provider?.translations,
                        )?.[router.locale]?.userTranslate?.description
                      }
                    </Typography>
                  </StyledBlock>
                  <Typography variant={'body3'} mt={'5px'}>
                    {`${t('priceFrom')}: ${provider?.price} ${t(provider?.currencyCode)} / ${
                      Number.isNaN(+provider.pricePer)
                        ? t(provider.pricePer)
                        : convertToMinutes(provider.pricePer, t)
                    }`}
                  </Typography>
                  <Divider margin={'10px 0'} />
                  {provider?.subservices.map((subservice) => {
                    return (
                      <>
                        <Typography>
                          {
                            transformLocalesToObjectWithUserData(
                              locales?.getLocales,
                              subservice?.translations,
                            )?.[router.locale]?.userTranslate?.description
                          }
                        </Typography>
                        <Typography variant={'body3'} mt={'5px'}>
                          {`${t('priceFrom')}: ${subservice?.price} ${t(
                            subservice?.currencyCode,
                          )} / ${
                            Number.isNaN(+subservice.pricePer)
                              ? t(subservice.pricePer)
                              : convertToMinutes(subservice.pricePer, t)
                          }`}
                        </Typography>
                        <Divider margin={'10px 0'} />
                      </>
                    );
                  })}
                </>
              )}

              <ChipsList chipsArr={provider?.subcategories} margin={'6px 0 0'} />
              <Divider />
              <StyledBlock>
                <BlockTitle>{t('languages')}</BlockTitle>
                <BlockSubTitle>{t('providerLanguages')}</BlockSubTitle>
                <ChipsList chipsArr={provider?.user?.userLanguages} />
              </StyledBlock>
              {provider?.user?.companyName && (
                <>
                  <Divider />
                  <StyledBlock>
                    <Addition display={'flex'} flexDirection={'column'} component={'div'}>
                      <BlockTitle>{t('companyName')} </BlockTitle>
                      <BlockSubTitle>{provider.user.companyName}</BlockSubTitle>
                    </Addition>
                  </StyledBlock>
                </>
              )}
              <Divider />
              <StyledBlock>
                <BlockTitle>{t('placeOfWork')}</BlockTitle>
                <BlockSubTitle>{t('thisSpecialistProvidesServices')}</BlockSubTitle>
                <ChipsList chipsArr={provider?.workplaces} />
              </StyledBlock>
              {provider?.country && (
                <>
                  <Divider />
                  <StyledBlock>
                    <Addition display={'flex'} flexDirection={'column'} component={'div'}>
                      <BlockTitle>{t('location')} </BlockTitle>
                      <BlockSubTitle>
                        {getNameFromTranslations(provider.country.translations, i18n)}{' '}
                        {provider?.city
                          ? getNameFromTranslations(provider.city.translations, i18n)
                          : ''}{' '}
                        {provider?.address || ''}
                      </BlockSubTitle>
                    </Addition>
                  </StyledBlock>
                </>
              )}
              {provider?.user?.about && (
                <>
                  <Divider />
                  <StyledBlock>
                    <Addition display={'flex'} flexDirection={'column'} component={'div'}>
                      <BlockTitle>{t('aboutMe')} </BlockTitle>
                      <BlockSubTitle className={'about'}>
                        {
                          transformLocalesToObjectWithUserData(
                            locales?.getLocales,
                            provider?.user?.translations,
                          )?.[router.locale]?.userTranslate?.about
                        }
                      </BlockSubTitle>
                    </Addition>
                  </StyledBlock>
                </>
              )}
            </ColumnWrapper>
          </UpperPart>
        </ProviderItem>
        <>
          <BasicTabs
            tabs={
              isPhotosHidden || isCertificatesHidden
                ? removeEmptyTab(PROVIDER_PAGE_TAB, nameOfHiddenTabs)
                : PROVIDER_PAGE_TAB
            }
            tabPanels={removeEmptyTab(
              [
                <TabComments
                  key={'reviews'}
                  reviews={reviews}
                  reviewsLoading={reviewsLoading}
                  reviewsReference={reviewsReference}
                  handleOpenModal={handleOpenModal}
                />,
                <TabContacts
                  key={'contacts'}
                  userInfo={userInfo}
                  contacts={provider?.user?.contacts}
                />,
                <TabServicePhotos
                  key={'photos'}
                  userInfo={userInfo}
                  provider={provider}
                  handleZoomImage={handleZoomImage}
                />,
                <TabServiceCertificates
                  key={'certificates'}
                  userInfo={userInfo}
                  provider={provider}
                  handleZoomImage={handleZoomImage}
                />,
              ],
              nameOfHiddenTabs,
            )}
            initialTab={initialTab}
            autoScrollToTab={autoScrollToReviews || autoScrollToContacts}
          />
        </>
      </>
      <ModalComponent
        type={modalType}
        open={isModalOpen}
        handleClose={handleCloseModal}
        setModalType={setModalType}
        modalData={modalData}
      />
    </Container>
  );
};

export default Master;

export const getServerSideProps = async (ctx) => {
  try {
    const { data: providerData } = await createApolloClient(ctx).query({
      query: GET_SERVICE,
      variables: {
        getServiceId: ctx.query.id,
      },
      fetchPolicy: 'network-only',
    });

    const title = `${providerData.getService.user.firstName} ${providerData.getService.user.lastName}`;
    return {
      props: {
        ...(await serverSideTranslations(ctx.locale ?? 'sr')),
        title,
        data: providerData,
      },
    };
  } catch {
    return {
      notFound: true,
    };
  }
};

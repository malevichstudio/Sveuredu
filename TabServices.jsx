import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

import ServicesList from '@/components/ServicesList';
import Button from '@/components/UI/Button';
import { ROUTES } from '@/constants/constants';
import { useGetCurrentUser } from '@/graphql/hooks/useQueries';
import { useAuth, useToast } from '@/hooks';

import { ListWrapper } from '../../ToProfilePage/styles';

const TabServices = ({ servicesReference, services, setUserLocalState }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const { userInfo, logout } = useAuth();
  const [variant, setToastConfig] = useToast();
  const { loading } = useGetCurrentUser({
    onError: (data) => {
      if (data?.message === 'UNAUTHORIZED') {
        logout();
      }
    },
  });

  const handleToast = (toastVariant) => {
    setToastConfig(variant[toastVariant]);
  };

  const onClickButton = () => {
    if (services.length < userInfo?.tariffPlan?.countService) {
      router.push(ROUTES.myService);
    } else {
      setToastConfig(variant.notMoreServicesThan);
    }
  };

  return (
    <Box ref={servicesReference}>
      <Button
        className={'saveMobile'}
        margin={'10px 0 20px 0'}
        type={'submit'}
        title={t('addNewService')}
        onClickButton={onClickButton}
      />
      <ListWrapper>
        <ServicesList
          services={services}
          setUserLocalState={setUserLocalState}
          loading={loading}
          onToast={handleToast}
        />
      </ListWrapper>
    </Box>
  );
};

export default TabServices;

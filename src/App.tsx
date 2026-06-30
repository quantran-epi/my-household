import './App.css';
import { Provider } from 'react-redux';
import { persistor, store } from '@store/Store';
import { PersistGate } from 'redux-persist/integration/react';
import { RootRouter } from '@routing/RootRouter';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import moment from 'moment';
import 'moment/locale/vi';
import { MessageProvider } from '@components/Message';
import { ModalProvider } from '@components/Modal/ModalProvider';
import { AppInitializer } from '@components/AppInitializer/AppInitializer';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { iosTokens } from '@theme';

dayjs.locale('vi');
moment.locale('vi');

function App() {
  return (
    <ConfigProvider locale={viVN} theme={{
      token: {
        colorPrimary: iosTokens.color.primary,
        colorPrimaryHover: iosTokens.color.primaryHover,
        colorPrimaryActive: iosTokens.color.primaryActive,
        colorLink: iosTokens.color.primary,
        colorBorderSecondary: iosTokens.color.borderIdle,
        fontFamily: iosTokens.type.fontFamily,
        fontSize: iosTokens.type.body.fontSize,
        borderRadius: iosTokens.radius.md,
        zIndexPopupBase: 4000,
      },
      components: {
        DatePicker: { zIndexPopup: 4200 },
        Dropdown: { zIndexPopup: 4200 },
        Menu: { zIndexPopup: 4200 },
        Popover: { zIndexPopup: 4200 },
        Select: { zIndexPopup: 4200 },
        Tooltip: { zIndexPopup: 4200 },
      },
    }}>

      <MessageProvider>
        <ModalProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <AppInitializer>
                <ErrorBoundary>
                  <RootRouter />
                </ErrorBoundary>
              </AppInitializer>
            </PersistGate>
          </Provider>
        </ModalProvider>
      </MessageProvider>
    </ConfigProvider>
  );
}

export default App;

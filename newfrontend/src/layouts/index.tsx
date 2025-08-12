import { Layout } from 'antd';
import { Suspense } from 'react';
import styled from 'styled-components';

import { CircleLoading } from '@/components/Loading';
import ProgressBar from '@/components/ProgressBar';
import { useSettings } from '@/store/setting';
import { cn } from '@/utils';

import Header from './Header';
import Main from './Main';
import Nav from './Nav';

import { ThemeMode } from '#/enum';

function DashboardLayout() {
  const { themeMode } = useSettings();

  return (
    <ScrollbarStyleWrapper $themeMode={themeMode}>
      <ProgressBar />
      <Layout className={cn('flex h-screen flex-row overflow-hidden')}>
        <Suspense fallback={<CircleLoading />}>
          <Layout>
            <Header />
            <Nav />
            <Main />
          </Layout>
        </Suspense>
      </Layout>
    </ScrollbarStyleWrapper>
  );
}
export default DashboardLayout;

// Move styles to a separate constant
const scrollbarStyles = {
  dark: {
    track: '#2c2c2c',
    thumb: '#6b6b6b',
    thumbHover: '#939393',
  },
  light: {
    track: '#FAFAFA',
    thumb: '#C1C1C1',
    thumbHover: '#7D7D7D',
  },
};

const ScrollbarStyleWrapper = styled.div<{ $themeMode?: ThemeMode }>`
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    border-radius: 8px;
    background: ${({ $themeMode }) =>
      $themeMode === ThemeMode.Dark ? scrollbarStyles.dark.track : scrollbarStyles.light.track};
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: ${({ $themeMode }) =>
      $themeMode === ThemeMode.Dark ? scrollbarStyles.dark.thumb : scrollbarStyles.light.thumb};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ $themeMode }) =>
      $themeMode === ThemeMode.Dark
        ? scrollbarStyles.dark.thumbHover
        : scrollbarStyles.light.thumbHover};
  }

  .simplebar-scrollbar::before {
    background: ${({ $themeMode }) =>
      $themeMode === ThemeMode.Dark ? scrollbarStyles.dark.thumb : scrollbarStyles.light.thumb};
  }

  .simplebar-scrollbar.simplebar-visible:before {
    opacity: 1;
  }
`;

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { BackableTabs, TabItem } from '@/components/backable-tabs';
import { useBreadcrumbStore } from '@/store/breadcrumbStore';

import { useRoleList } from '../use-software';

import Config from './config';
import RevisionList from './revision-list';

function PublishConfig() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('1');
  const { list: softwareInfo } = useRoleList();
  const { setCustomBreadcrumbs } = useBreadcrumbStore();

  const softwareId = Number(id);
  const softwareName = softwareInfo?.find((item) => item.id === softwareId)?.name;

  const tabItems: TabItem[] = [
    {
      key: '1',
      label: '基本信息',
      children: <Config id={softwareId} onConfigRelease={() => setActiveTab('2')} />,
    },
    {
      key: '2',
      label: '版本列表',
      children: <RevisionList id={softwareId} />,
    },
  ];

  useEffect(() => {
    setCustomBreadcrumbs([
      {
        key: 'software_manage',
        title: <Link to="/software_manage">软件管理</Link>,
      },
      {
        key: 'publish_config',
        title: softwareName || '',
      },
    ]);

    return () => {
      setCustomBreadcrumbs(undefined);
    };
  }, [softwareName, setCustomBreadcrumbs]);

  if (!softwareId) {
    return <div className="text-red-500">无效的软件 ID</div>;
  }

  return (
    <div className="flex flex-col">
      <BackableTabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        title={softwareName || ''}
        backPath="/software_manage"
      />
    </div>
  );
}

export default PublishConfig;

import React, { useMemo, useState } from 'react';
import type { LogEntry, PartnerProfile } from '../../domain';
import { Modal, ConfirmModal } from '../../shared/ui';
import { useToast } from '../../contexts/ToastContext';
import PartnerList from './PartnerList';
import PartnerDetail from './PartnerDetail';
import PartnerEditForm from './PartnerEditForm';
import {
  COLORS,
  computePartnerStats,
  sortPartnersByActivity
} from './model/partnerManagerData';

interface PartnerManagerData {
  partners: PartnerProfile[];
  logs?: LogEntry[];
}

interface PartnerManagerActions {
  onSave: (partner: PartnerProfile) => void;
  onDelete: (id: string) => void;
}

interface PartnerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  data: PartnerManagerData;
  actions: PartnerManagerActions;
}

type View = 'list' | 'detail' | 'edit';

const PartnerManager: React.FC<PartnerManagerProps> = ({ isOpen, onClose, data, actions }) => {
  const { partners, logs = [] } = data;
  const { onSave, onDelete } = actions;
  const { showToast } = useToast();

  const [view, setView] = useState<View>('list');
  const [activePartner, setActivePartner] = useState<PartnerProfile | null>(null);
  const [formData, setFormData] = useState<Partial<PartnerProfile>>({});
  const [editStep, setEditStep] = useState(1);
  const [tempMilestone, setTempMilestone] = useState({ name: '', date: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const partnerStats = useMemo(() => computePartnerStats(logs), [logs]);
  const sortedPartners = useMemo(() => sortPartnersByActivity(partners, partnerStats), [partners, partnerStats]);

  if (!isOpen) return null;

  const handleCreate = () => {
    setFormData({
      id: Date.now().toString(),
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      sensitiveSpots: [],
      stimulationPreferences: [],
      likedPositions: [],
      dislikedActs: [],
      socialTags: [],
      type: 'stable',
      isMarried: false,
      smoking: 'none',
      alcohol: 'none',
      milestones: {}
    });
    setTempMilestone({ name: '', date: '' });
    setEditStep(1);
    setView('edit');
  };

  const handleEdit = (partner: PartnerProfile) => {
    setFormData({ ...partner });
    setTempMilestone({ name: '', date: '' });
    setEditStep(1);
    setView('edit');
  };

  const handleView = (partner: PartnerProfile) => {
    setActivePartner(partner);
    setView('detail');
  };

  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      showToast('请输入伴侣名字', 'error');
      return;
    }
    onSave(formData as PartnerProfile);
    setView('list');
  };

  const handleDeleteRequest = (id: string) => setDeleteId(id);

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
      setView('list');
    }
  };

  const toggleArrayItem = (field: keyof PartnerProfile, value: string) => {
    const current = (formData[field] as string[]) || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: next });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={view === 'edit' ? (formData.id ? '编辑档案' : '新建档案') : view === 'detail' ? '伴侣详情' : '伴侣管理'}
      footer={null}
    >
      <div className="h-[70vh] flex flex-col">
        {view === 'list' && (
          <PartnerList
            partners={partners}
            sortedPartners={sortedPartners}
            partnerStats={partnerStats}
            onCreate={handleCreate}
            onView={handleView}
          />
        )}

        {view === 'detail' && activePartner && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar pr-2">
              <PartnerDetail
                partner={activePartner}
                partnerStats={partnerStats}
                onEdit={handleEdit}
                onDeleteRequest={handleDeleteRequest}
              />
            </div>
            <div className="pt-4 border-t border-surface-border ">
              <button onClick={() => setView('list')} className="w-full py-3 bg-surface-muted  text-text-primary  font-bold rounded-xl">返回列表</button>
            </div>
          </div>
        )}

        {view === 'edit' && (
          <PartnerEditForm
            formData={formData}
            editStep={editStep}
            tempMilestone={tempMilestone}
            onChangeFormData={setFormData}
            onChangeTempMilestone={setTempMilestone}
            onToggleArrayItem={toggleArrayItem}
            onStepChange={setEditStep}
            onCancel={() => setView('list')}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="删除伴侣档案"
        message="确定删除此伴侣档案吗?这将不会删除已关联的历史日记,但会移除档案关联。"
        confirmLabel="删除"
      />
    </Modal>
  );
};

export default PartnerManager;

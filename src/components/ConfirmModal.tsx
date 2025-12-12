import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

type ConfirmModalProps = {
  show: boolean;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  show,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const confirm = confirmText ?? t('confirm.delete');
  const cancel = cancelText ?? t('confirm.cancel');
  return (
    <Modal show={show} onHide={onCancel} centered>
      {title && (
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
      )}
      <Modal.Body>
        <div className="small text-muted">{message}</div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirm}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

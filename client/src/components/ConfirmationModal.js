import React from 'react';
import './ConfirmationModal.css';
import { useTranslation } from 'react-i18next';

const ConfirmationModal = ({ show, onHide, onConfirm, title, body }) => {
  const { t } = useTranslation();
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <button type="button" className="close" onClick={onHide}>
            <span>&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <p>{body}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onHide}>
            {t('Cancel')}
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            {t('Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
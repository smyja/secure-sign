// Copyright 2017-2024 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AddressFlags } from '@polkadot/react-hooks/types';
import type { ActionStatus } from '../Status/types.js';

import React, { useCallback, useContext } from 'react';

import { Forget } from '@polkadot/react-components';
import { useApi, useToggle } from '@polkadot/react-hooks';
import { isFunction } from '@polkadot/util';

import Button from '../Button/index.js';
import { TransferModal } from '../modals/index.js';
import { styled } from '../styled.js';
import { useTranslation } from '../translate.js';
import { useProxies, useAccounts } from '@polkadot/react-hooks';
// import useProxies from '../../../page-multisig/src/Accounts/useProxies.js';

import { MultisigAccountSidebarCtx } from '@polkadot/react-hooks/ctx/MultisigAccountSidebar';

import ProxyOverview from '../../../page-multisig/src/modals/ProxyOverview.js'

interface Props {
  className?: string;
  flags: AddressFlags;
  isEditingName: boolean;
  isEditing: boolean;
  toggleIsEditingName: () => void;
  toggleIsEditingTags: () => void;
  onCancel: () => void;
  onSaveName: () => void;
  onSaveTags: () => void;
  onForgetAccount: () => void;
  onForgetAddress: () => void;
  onUpdateName?: (() => void) | null;
  recipientId: string;
  // toggleProxyOverview: () => void;
}

function AccountMenuButtons ({ className = '', flags, isEditing, isEditingName, onCancel, onForgetAccount, onForgetAddress, onSaveName, onSaveTags, onUpdateName, recipientId, toggleIsEditingName, toggleIsEditingTags }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isTransferOpen, toggleIsTransferOpen] = useToggle();
  const api = useApi();
  const proxy = useProxies();
  const accounts = useAccounts();

  const [isForgetOpen, toggleForget] = useToggle();
  const [isProxyOverviewOpen, toggleProxyOverview] = useToggle();

  const proxyIndex: number = accounts.allAccounts.findIndex((address) => address === recipientId);
  const previousProxy = Array.isArray(proxy) ? proxy[proxyIndex] : undefined;

  const setAddress = useContext(MultisigAccountSidebarCtx);

  const toggleIsEditing = useCallback(() => {
    flags.isEditable && toggleIsEditingName();
    toggleIsEditingTags();
  }, [flags.isEditable, toggleIsEditingName, toggleIsEditingTags]);

  const _onUpdateName = useCallback(
    (): void => {
      onSaveName();
      onUpdateName && onUpdateName();
    },
    [onSaveName, onUpdateName]
  );

  const _onForgetAddress = useCallback(
    (): void => {
      if (!recipientId) {
        return;
      }

      const status: Partial<ActionStatus> = {
        account: recipientId,
        action: 'forget'
      };

      try {
        onForgetAddress();
        status.status = 'success';
        status.message = t('address forgotten');
      } catch (error) {
        status.status = 'error';
        status.message = (error as Error).message;
      }

      toggleForget();
    },
    [onForgetAddress, recipientId, t, toggleForget]
  );

  const _onForgetAccount = useCallback(
    (): void => {
      if (!recipientId) {
        return;
      }

      const status: Partial<ActionStatus> = {
        account: recipientId,
        action: 'forget'
      };

      try {
        onForgetAccount();
        status.status = 'success';
        status.message = t('account forgotten');
        setAddress && setAddress([null, onUpdateName ?? null]);
      } catch (error) {
        status.status = 'error';
        status.message = (error as Error).message;
      }

      toggleForget();
    },
    [onForgetAccount, recipientId, t, toggleForget]
  );

  const updateName = useCallback(() => {
    if (isEditingName && (flags.isInContacts || flags.isOwned)) {
      _onUpdateName();
      toggleIsEditingName();
    }
  }, [isEditingName, flags.isInContacts, flags.isOwned, _onUpdateName, toggleIsEditingName]);

  const onEdit = useCallback(() => {
    if (isEditing) {
      updateName();
      onSaveTags();
    }

    toggleIsEditing();
  }, [isEditing, toggleIsEditing, updateName, onSaveTags]);

  return (
    <StyledDiv className={`${className} ui--AddressMenu-buttons`}>
      {isEditing
        ? (
          <Button.Group>
            <Button
              icon='times'
              label={t('Cancel')}
              onClick={onCancel}
            />
            <Button
              icon='save'
              label={t('Save')}
              onClick={onEdit}
            />
            <Button
              icon='trash'
              label={t('Forget')}
              onClick={toggleForget}
            />
          </Button.Group>
        )
        : (
          <Button.Group>
            {(isFunction(api.api.tx.balances?.transferAllowDeath) || isFunction(api.api.tx.balances?.transfer)) && (
              <Button
                icon='paper-plane'
                isDisabled={isEditing}
                label={t('Send')}
                onClick={toggleIsTransferOpen}
              />
            )}
            {!flags.isOwned && !flags.isInContacts && (
              <Button
                icon='plus'
                isDisabled={isEditing}
                label={t('Save')}
                onClick={_onUpdateName}
              />
            )}
            {!flags.isOwned && flags.isInContacts && (
              <Button
                icon='ban'
                isDisabled={isEditing}
                label={t('Remove')}
                onClick={_onForgetAddress}
              />
            )}
            <Button
              icon='edit'
              isDisabled={!flags.isEditable}
              label={t('Edit')}
              onClick={onEdit}
            />
            <Button
              icon='sitemap'
              isDisabled={isEditing}
              label={t('Add proxy')}
              onClick={toggleProxyOverview}
            />
          </Button.Group>
        )
      }
      {isTransferOpen && (
        <TransferModal
          key='modal-transfer'
          onClose={toggleIsTransferOpen}
          senderId={recipientId}
        />
      )}
      {isForgetOpen && (
        <Forget
          address={recipientId}
          key='modal-forget-account'
          onClose={toggleForget}
          onForget={_onForgetAccount}
        />
      )}
      {isProxyOverviewOpen && (
        <ProxyOverview
          key='modal-proxy-overview'
          onClose={toggleProxyOverview}
          previousProxy={previousProxy}
          proxiedAccount={recipientId}
        />
      )}
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  display: flex;
  justify-content: center;
  flex-basis: 360px;
  .ui--Button-Group {
    display: flex;
    justify-content: flex-start;
    margin: 0;
  }

  @media only screen and (max-width: 1600px) {
    .ui--Button-Group {
      flex-direction: column;
      row-gap: 1rem;
      flex-basis: 160px
    }
  }
`;

export default React.memo(AccountMenuButtons);

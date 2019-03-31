// @flow
import * as React from 'react';
import { Redirect } from 'react-router-dom';
import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import { MoreIcon } from 'outline-icons';

import Document from 'models/Document';
import UiStore from 'stores/UiStore';
import AuthStore from 'stores/AuthStore';
import {
  documentUrl,
  documentMoveUrl,
  documentHistoryUrl,
  homeUrl,
} from 'utils/routeHelpers';
import { DropdownMenu, DropdownMenuItem } from 'components/DropdownMenu';

type Props = {
  ui: UiStore,
  auth: AuthStore,
  label?: React.Node,
  document: Document,
  className: string,
  showPrint?: boolean,
  showToggleEmbeds?: boolean,
};

@observer
class DocumentMenu extends React.Component<Props> {
  @observable redirectTo: ?string;

  componentDidUpdate() {
    this.redirectTo = undefined;
  }

  handleNewChild = (ev: SyntheticEvent<*>) => {
    const { document } = this.props;
    this.redirectTo = `${document.collection.url}/new?parentDocument=${
      document.id
    }`;
  };

  handleDelete = (ev: SyntheticEvent<*>) => {
    const { document } = this.props;
    this.props.ui.setActiveModal('document-delete', { document });
  };

  handleDocumentHistory = () => {
    this.redirectTo = documentHistoryUrl(this.props.document);
  };

  handleMove = (ev: SyntheticEvent<*>) => {
    this.redirectTo = documentMoveUrl(this.props.document);
  };

  handleDuplicate = async (ev: SyntheticEvent<*>) => {
    const duped = await this.props.document.duplicate();

    // when duplicating, go straight to the duplicated document content
    this.redirectTo = duped.url;
    this.props.ui.showToast('Document duplicated');
  };

  handleArchive = (ev: SyntheticEvent<*>) => {
    this.props.document.archive();

    // we only need to redirect away if we're currently looking at the
    // document – archving from a list view should not change the route.
    if (this.props.ui.activeDocumentId === this.props.document.id) {
      this.redirectTo = homeUrl();
    }
    this.props.ui.showToast('Document archived');
  };

  handleRestore = (ev: SyntheticEvent<*>) => {
    this.props.document.restore();

    // when restoring, go straight to the restored document content
    this.redirectTo = documentUrl(this.props.document);
    this.props.ui.showToast('Document restored');
  };

  handlePin = (ev: SyntheticEvent<*>) => {
    this.props.document.pin();
  };

  handleUnpin = (ev: SyntheticEvent<*>) => {
    this.props.document.unpin();
  };

  handleStar = (ev: SyntheticEvent<*>) => {
    this.props.document.star();
  };

  handleUnstar = (ev: SyntheticEvent<*>) => {
    this.props.document.unstar();
  };

  handleExport = (ev: SyntheticEvent<*>) => {
    this.props.document.download();
  };

  handleShareLink = async (ev: SyntheticEvent<*>) => {
    const { document } = this.props;
    if (!document.shareUrl) await document.share();

    this.props.ui.setActiveModal('document-share', { document });
  };

  render() {
    if (this.redirectTo) return <Redirect to={this.redirectTo} push />;

    const { document, label, className, showPrint, auth } = this.props;
    const canShareDocuments = auth.team && auth.team.sharing;

    if (document.deletedAt) {
      return (
        <DropdownMenu label={label || <MoreIcon />} className={className}>
          <DropdownMenuItem onClick={this.handleRestore}>
            Restore
          </DropdownMenuItem>
          <DropdownMenuItem onClick={this.handleDelete}>
            Delete…
          </DropdownMenuItem>
        </DropdownMenu>
      );
    }

    return (
      <DropdownMenu label={label || <MoreIcon />} className={className}>
        {!document.isDraft ? (
          <React.Fragment>
            {document.pinned ? (
              <DropdownMenuItem onClick={this.handleUnpin}>
                Unpin
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={this.handlePin}>Pin</DropdownMenuItem>
            )}
            {document.starred ? (
              <DropdownMenuItem onClick={this.handleUnstar}>
                Unstar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={this.handleStar}>
                Star
              </DropdownMenuItem>
            )}
            {canShareDocuments && (
              <DropdownMenuItem
                onClick={this.handleShareLink}
                title="Create a public share link"
              >
                Share link…
              </DropdownMenuItem>
            )}
            <hr />
            <DropdownMenuItem onClick={this.handleDocumentHistory}>
              Document history
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={this.handleNewChild}
              title="Create a new child document for the current document"
            >
              New child document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={this.handleDuplicate}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={this.handleArchive}>
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={this.handleDelete}>
              Delete…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={this.handleMove}>Move…</DropdownMenuItem>
          </React.Fragment>
        ) : (
          <DropdownMenuItem onClick={this.handleDelete}>
            Delete…
          </DropdownMenuItem>
        )}
        <hr />
        <DropdownMenuItem onClick={this.handleExport}>
          Download
        </DropdownMenuItem>
        {showPrint && (
          <DropdownMenuItem onClick={window.print}>Print</DropdownMenuItem>
        )}
      </DropdownMenu>
    );
  }
}

export default inject('ui', 'auth')(DocumentMenu);

import { compose, mapProps, pure } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Table, Segment, Label } from 'semantic-ui-react';

const QuotationDownloads = ({ documents }) => (
  <Segment secondary>
    <Label horizontal attached="top">
      <Label.Detail>Generated Documents</Label.Detail>
    </Label>
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>File</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {documents &&
          documents.map(doc => (
            <Table.Row>
              <Table.Cell>
                <a target="_new" rel="noopener" href={doc.url}>
                  {doc.name}
                </a>
              </Table.Cell>
            </Table.Row>
          ))}
      </Table.Body>
    </Table>
  </Segment>
);

export default compose(
  graphql(gql`
    query quotation($quotationId: ID!) {
      quotation(quotationId: $quotationId) {
        _id
        documents {
          _id
          url
          name
        }
      }
    }
  `),
  mapProps(({ data: { quotation = {} } }) => ({
    ...quotation
  })),
  pure
)(QuotationDownloads);

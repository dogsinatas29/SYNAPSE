import { LanguageClient } from 'vscode-languageclient/node';

export let client: LanguageClient;

export function setClient(newClient: LanguageClient) {
    client = newClient;
}

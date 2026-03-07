import { ArchitectureDSL } from '../core/ArchitectureDSL';

describe('ArchitectureDSL', () => {
    const dsl = new ArchitectureDSL();

    it('should correctly parse event flows', () => {
        const content = 'event UserClick -> logic AuthVerify';
        const result = dsl.parse(content);
        
        expect(result.nodes).toContainEqual(expect.objectContaining({ id: 'UserClick', type: 'event' }));
        expect(result.nodes).toContainEqual(expect.objectContaining({ id: 'AuthVerify', type: 'source' }));
        expect(result.edges).toContainEqual(expect.objectContaining({ from: 'UserClick', to: 'AuthVerify', type: 'control_bidirectional' }));
    });

    it('should correctly parse usage relations', () => {
        const content = 'logic AuthVerify uses data UserTable';
        const result = dsl.parse(content);

        expect(result.nodes).toContainEqual(expect.objectContaining({ id: 'AuthVerify', type: 'source' }));
        expect(result.nodes).toContainEqual(expect.objectContaining({ id: 'UserTable', type: 'source' }));
        expect(result.edges).toContainEqual(expect.objectContaining({ from: 'AuthVerify', to: 'UserTable', type: 'data_flow' }));
    });

    it('should correctly parse service calls', () => {
        const content = 'logic AuthVerify calls service LDAP_API';
        const result = dsl.parse(content);

        expect(result.nodes).toContainEqual(expect.objectContaining({ id: 'AuthVerify', type: 'source' }));
        expect(result.nodes).toContainEqual(expect.objectContaining({ id: 'LDAP_API', type: 'service' }));
        expect(result.edges).toContainEqual(expect.objectContaining({ from: 'AuthVerify', to: 'LDAP_API', type: 'api_call' }));
    });
});

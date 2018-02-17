import {expect} from 'chai';
import {mock, instance} from 'ts-mockito';
import {AliasService, ConfigService} from '../services';

describe('AliasService', () => {

    let aliasService: AliasService;

    beforeEach(() => {
        const config: ConfigService = mock(ConfigService);
        aliasService = new AliasService(instance(config));
    });

    it('should default to empty alias', () => {
        const aliases = aliasService.getAlias();
        expect(aliases).to.be.an('object', 'Aliases is not an object');
        expect(Object.keys(aliases).length).to.equal(0, 'Default alias is not empty');
    });

    it('should return empty arrays for nonexistant alias', () => {
        const alias = aliasService.getAlias('newOne');
        expect(alias).to.not.be.null;
        expect(Array.isArray(alias)).to.be.true;
        expect((<string[]>alias).length).to.equal(0, 'Empty alias has a length');
    });

    it('should allow setting aliases', () => {
        aliasService.setAlias('test', ['val0', 'val1', 'val2']);
        const alias = aliasService.getAlias('test');
        expect(alias).to.not.be.null;
        expect(Array.isArray(alias)).to.be.true;
        expect(alias).to.have.members(['val0', 'val1', 'val2'], 'Members saved incorrectly to alias');
    });

    it('should allow deleting aliases', () => {
        aliasService.setAlias('test', ['val0', 'val1', 'val2']);
        const alias = aliasService.getAlias('test');
        expect(alias).to.not.be.null;
        expect(Array.isArray(alias)).to.be.true;
        expect(alias).to.have.members(['val0', 'val1', 'val2'], 'Members saved incorrectly to alias');
        aliasService.deleteAlias('test');
        const newAlias = aliasService.getAlias('test');
        expect(newAlias).to.not.be.null;
        expect(Array.isArray(newAlias)).to.be.true;
        expect((<string[]>newAlias).length).to.equal(0, 'Empty alias has a length');
    });

});

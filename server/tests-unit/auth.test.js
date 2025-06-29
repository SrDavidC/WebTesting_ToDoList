const auth = require('../handlers/auth');
const { createUser, verifyUser } = require('../lib/store');
const { signToken } = require('../lib/auth');
const { sendJson, parseBody } = require('../lib/utils');

jest.mock('../lib/store');
jest.mock('../lib/auth');
jest.mock('../lib/utils');


describe('auth handlers', () => {
    let res;

    beforeEach(() => {
        res = {};
        sendJson.mockClear();
        parseBody.mockClear();
        createUser.mockClear();
        verifyUser.mockClear();
        signToken.mockClear();
    });

    describe('register', () => {
        it('should register a new user and return token', async () => {
            const req = {};
            parseBody.mockResolvedValue({ username: 'user', password: 'pass' });
            verifyUser.mockReturnValue(false);
            createUser.mockReturnValue({ id: 1 });
            signToken.mockReturnValue('token123');

            await auth.register(req, res);

            expect(verifyUser).toHaveBeenCalledWith('user', 'pass');
            expect(createUser).toHaveBeenCalledWith('user', 'pass');
            expect(signToken).toHaveBeenCalledWith({ id: 1, username: 'user' });
            expect(sendJson).toHaveBeenCalledWith(res, 201, { token: 'token123' });
        });

        it('should return 400 if username or password missing', async () => {
            const req = {};
            parseBody.mockResolvedValue({ username: '', password: '' });

            await auth.register(req, res);

            expect(sendJson).toHaveBeenCalledWith(res, 400, { error: 'username and password required' });
        });

        it('should return 400 if user exists', async () => {
            const req = {};
            parseBody.mockResolvedValue({ username: 'user', password: 'pass' });
            verifyUser.mockReturnValue(true);

            await auth.register(req, res);

            expect(sendJson).toHaveBeenCalledWith(res, 400, { error: 'user exists' });
        });
    });

    describe('login', () => {
        it('should login and return token', async () => {
            const req = {};
            parseBody.mockResolvedValue({ username: 'user', password: 'pass' });
            verifyUser.mockReturnValue({ id: 1 });
            signToken.mockReturnValue('token456');

            await auth.login(req, res);

            expect(verifyUser).toHaveBeenCalledWith('user', 'pass');
            expect(signToken).toHaveBeenCalledWith({ id: 1, username: 'user' });
            expect(sendJson).toHaveBeenCalledWith(res, 200, { token: 'token456' });
        });

        it('should return 400 if username or password missing', async () => {
            const req = {};
            parseBody.mockResolvedValue({ username: '', password: '' });

            await auth.login(req, res);

            expect(sendJson).toHaveBeenCalledWith(res, 400, { error: 'username and password required' });
        });

        it('should return 401 if credentials are invalid', async () => {
            const req = {};
            parseBody.mockResolvedValue({ username: 'user', password: 'wrong' });
            verifyUser.mockReturnValue(false);

            await auth.login(req, res);

            expect(sendJson).toHaveBeenCalledWith(res, 401, { error: 'invalid credentials' });
        });
    });
});
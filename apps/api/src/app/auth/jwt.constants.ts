export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'dev-secret',
  expiresIn: 3600,
};

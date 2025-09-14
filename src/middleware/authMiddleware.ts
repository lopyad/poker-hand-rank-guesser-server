// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse, DecodedToken, FuncResponse } from '../types';

// Core JWT verification logic
export const verifyJwt = (token: string): FuncResponse<DecodedToken> => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return [null, new Error('Server configuration error: JWT secret missing.')];
  }

  try{
    const result = jwt.verify(token, secret) as DecodedToken;
    return [result, null];
  } catch (e){
    let errorMessage = 'Authentication failed.';
    if (e instanceof jwt.TokenExpiredError) {
      errorMessage = 'Authentication failed: Token expired.';
    } else if (e instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Authentication failed: Invalid token.';
    }
    return [null, new Error(errorMessage)];
  }
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Authorization 헤더에서 토큰 추출
  const authHeader = req.headers['authorization'];
  // "Bearer YOUR_TOKEN_HERE" 형식에서 "YOUR_TOKEN_HERE" 부분만 추출
  const token = authHeader && authHeader.split(' ')[1];

  // 2. 토큰이 없는 경우 처리
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: No token provided' } as ApiResponse<any>);
  }

  try {
    // 3. 코어 검증 로직 사용
    const [decoded, error] = verifyJwt(token);
    if(error){
      throw error;
    }
    req.user = decoded;

    // 5. 다음 미들웨어 또는 라우터 핸들러로 제어 전달
    next();
  } catch (error) {
    // 6. 토큰 검증 실패 시 에러 처리
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ success: false, message: 'Access Denied: Token expired' } as ApiResponse<any>);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ success: false, message: 'Access Denied: Invalid token' } as ApiResponse<any>);
    }
    // 그 외 알 수 없는 에러
    console.error('JWT verification error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error during token verification.' } as ApiResponse<any>);
  }
};
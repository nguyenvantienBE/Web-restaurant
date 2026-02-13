import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private config: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('jwt.secret'),
        });
    }

    async validate(payload: any) {
        // Validate user is still active and get fresh data
        const user = await this.authService.validateUser(payload.sub);

        if (!user) {
            return null;
        }

        // Return user object that will be attached to request.user
        return user;
    }
}

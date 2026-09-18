import mockAuthService from '@/services/mock/authMock'
import realAuthService from '@/services/real/authReal'

const authService = import.meta.env.VITE_USE_MOCK === 'false' ? realAuthService : mockAuthService

export default authService

import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <Card className="w-full max-w-md text-center">
        <div className="text-3xl font-black">404</div>
        <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No encontramos esta ruta.</div>
        <div className="mt-5">
          <Link to="/dashboard">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

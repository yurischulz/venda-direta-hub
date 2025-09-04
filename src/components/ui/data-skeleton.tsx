import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

// Skeleton para cards de estatísticas (dashboard)
export const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-16" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-6 w-20" />
    </CardContent>
  </Card>
);

// Skeleton para lista de contas de clientes
export const CustomerAccountSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton para produtos
export const ProductSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton para vendas
export const SaleSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton para pagamentos
export const PaymentSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex justify-between text-sm">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton para formulários
export const FormSkeleton = () => (
  <div className="space-y-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <Skeleton className="h-10 w-full mt-6" />
  </div>
);

// Skeleton para lista genérica
export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-1" />
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);
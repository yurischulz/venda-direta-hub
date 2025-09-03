import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </main>
    );
  }

  if (session) {
    return <Dashboard />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Bem-vindo ao SwiftSale</h1>
        <p className="text-xl text-muted-foreground">Seu hub para controle de vendas direto.</p>
        <div className="flex items-center justify-center">
          <Button asChild>
            <Link to="/auth">Entrar ou Cadastrar</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;

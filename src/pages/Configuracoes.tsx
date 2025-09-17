import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Configuracoes() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [ldapConfig, setLdapConfig] = useState({
    host: "",
    baseDn: "",
    username: "",
    password: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem acessar as configurações.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleInputChange = (field: keyof typeof ldapConfig, value: string) => {
    setLdapConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Save LDAP configuration to localStorage for now
      // In a real application, this would be saved to a secure backend
      localStorage.setItem('ldap_config', JSON.stringify(ldapConfig));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações LDAP foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving LDAP config:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Configure as opções do sistema
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações LDAP
          </CardTitle>
          <CardDescription>
            Configure os parâmetros de conexão com o servidor LDAP para autenticação de usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host do Servidor LDAP</Label>
              <Input
                id="host"
                type="text"
                placeholder="ex: ldap.exemplo.com ou 192.168.1.100"
                value={ldapConfig.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseDn">Base DN</Label>
              <Input
                id="baseDn"
                type="text"
                placeholder="ex: dc=exemplo,dc=com"
                value={ldapConfig.baseDn}
                onChange={(e) => handleInputChange('baseDn', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuário de Bind</Label>
              <Input
                id="username"
                type="text"
                placeholder="ex: cn=admin,dc=exemplo,dc=com"
                value={ldapConfig.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha de Bind</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={ldapConfig.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> As configurações LDAP são sensíveis. 
              Certifique-se de que os dados estão corretos antes de salvar.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
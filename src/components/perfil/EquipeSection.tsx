import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useInternalUser } from "@/hooks/useInternalUser";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Mail, Loader2, Trash2, X, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface WorkspaceInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const EquipeSection = () => {
  const { toast } = useToast();
  const { internalUser, isMaster } = useInternalUser();
  const { workspaceId, workspace } = useWorkspace();
  
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [cancelingInvite, setCancelingInvite] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    if (!workspaceId) return;
    
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, status")
        .eq("workspace_id", workspaceId)
        .eq("status", "active");
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch invites
  const fetchInvites = async () => {
    if (!workspaceId) return;
    
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from("workspace_invites")
        .select("id, email, role, status, created_at, expires_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Update expired invites status client-side for display
      const now = new Date();
      const updatedData = (data || []).map(invite => ({
        ...invite,
        status: new Date(invite.expires_at) < now && invite.status === "pending" 
          ? "expired" 
          : invite.status
      }));
      
      setInvites(updatedData);
    } catch (error) {
      console.error("Erro ao carregar convites:", error);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchUsers();
      fetchInvites();
    }
  }, [workspaceId]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Erro",
        description: "Digite o email do convidado",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(inviteEmail)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive",
      });
      return;
    }

    if (!workspaceId || !internalUser) {
      toast({
        title: "Erro",
        description: "Workspace não encontrado",
        variant: "destructive",
      });
      return;
    }

    // Check if email already has pending invite
    const existingInvite = invites.find(
      i => i.email.toLowerCase() === inviteEmail.toLowerCase() && i.status === "pending"
    );
    if (existingInvite) {
      toast({
        title: "Erro",
        description: "Já existe um convite pendente para este email",
        variant: "destructive",
      });
      return;
    }

    // Check if user already exists in workspace
    const existingUser = users.find(
      u => u.email.toLowerCase() === inviteEmail.toLowerCase()
    );
    if (existingUser) {
      toast({
        title: "Erro",
        description: "Este usuário já faz parte do workspace",
        variant: "destructive",
      });
      return;
    }

    setSendingInvite(true);
    try {
      // Generate token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc("generate_invite_token");
      
      if (tokenError) throw tokenError;
      
      const token = tokenData;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Insert invite
      const { error: insertError } = await supabase
        .from("workspace_invites")
        .insert({
          workspace_id: workspaceId,
          email: inviteEmail.toLowerCase().trim(),
          role: inviteRole,
          status: "pending",
          token: token,
          expires_at: expiresAt.toISOString(),
          invited_by: internalUser.auth_user_id,
        });

      if (insertError) throw insertError;

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-invite", {
        body: {
          email: inviteEmail.toLowerCase().trim(),
          token: token,
          workspaceName: workspace?.nome || "Workspace",
          role: inviteRole,
        },
      });

      if (emailError) {
        console.error("Erro ao enviar email:", emailError);
        // Continue anyway, invite was created
      }

      toast({
        title: "Convite enviado!",
        description: `Convite enviado para ${inviteEmail}`,
      });

      setInviteEmail("");
      setInviteRole("user");
      fetchInvites();
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite",
        variant: "destructive",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!isMaster) {
      toast({
        title: "Erro",
        description: "Apenas o master pode remover usuários",
        variant: "destructive",
      });
      return;
    }

    // Prevent removing self
    if (userId === internalUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode remover a si mesmo",
        variant: "destructive",
      });
      return;
    }

    setRemovingUser(userId);
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: "inactive" })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: "O usuário foi removido do workspace",
      });

      fetchUsers();
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário",
        variant: "destructive",
      });
    } finally {
      setRemovingUser(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancelingInvite(inviteId);
    try {
      const { error } = await supabase
        .from("workspace_invites")
        .update({ status: "canceled" })
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado",
      });

      fetchInvites();
    } catch (error) {
      console.error("Erro ao cancelar convite:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o convite",
        variant: "destructive",
      });
    } finally {
      setCancelingInvite(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "master":
        return <Badge variant="default" className="bg-primary">Master</Badge>;
      case "admin":
        return <Badge variant="secondary">Admin</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pendente</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-600">Aceito</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      case "canceled":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isMaster) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Equipe
          </CardTitle>
          <CardDescription>
            Apenas o master pode gerenciar a equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Você não tem permissão para gerenciar usuários e convites.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Equipe
        </CardTitle>
        <CardDescription>
          Gerencie os usuários e convites do seu workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários ({users.length})
            </TabsTrigger>
            <TabsTrigger value="convites" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Convites ({invites.filter(i => i.status === "pending").length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="usuarios" className="space-y-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-right">
                          {user.role !== "master" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveUser(user.id)}
                              disabled={removingUser === user.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {removingUser === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Invites Tab */}
          <TabsContent value="convites" className="space-y-4">
            {/* Invite Form */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="invite-email" className="sr-only">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={sendingInvite}
                />
              </div>
              <div className="w-full sm:w-32">
                <Label htmlFor="invite-role" className="sr-only">Função</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as "admin" | "user")}
                  disabled={sendingInvite}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSendInvite}
                disabled={sendingInvite || !inviteEmail.trim()}
                className="w-full sm:w-auto"
              >
                {sendingInvite ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar
              </Button>
            </div>

            {/* Invites Table */}
            {loadingInvites ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum convite enviado
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>{getRoleBadge(invite.role)}</TableCell>
                        <TableCell>{getStatusBadge(invite.status)}</TableCell>
                        <TableCell>
                          {format(new Date(invite.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          {invite.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInvite(invite.id)}
                              disabled={cancelingInvite === invite.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {cancelingInvite === invite.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EquipeSection;

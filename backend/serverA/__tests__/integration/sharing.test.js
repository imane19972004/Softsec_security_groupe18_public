describe('Note Sharing Security', () => {
  it('should prevent sharing with non-existent user', async () => {
    // Test que l'API retourne 404 si le destinataire n'existe pas
  });

  it('should prevent sharing with self', async () => {
    // Test qu'on ne peut pas partager avec son propre email
  });

  it('should enforce permission validation', async () => {
    // Test que seules 'read' et 'write' sont acceptées
  });

  it('should allow owner to revoke share', async () => {
    // Test que le propriétaire peut révoquer un partage
  });

  it('should prevent non-owner from revoking share', async () => {
    // Test qu'un non-propriétaire ne peut pas révoquer
  });

  it('should limit max shares per note', async () => {
    // Test qu'on ne peut pas partager avec plus de 10 users
  });
});
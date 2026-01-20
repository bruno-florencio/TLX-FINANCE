  packages = [
    pkgs.nodejs_20
  ];
  idx.extensions = [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ];
  idx.previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
}
{ pkgs, ... }: {
  channel = "stable-24.11";

  packages = [
    pkgs.nodejs_20
    pkgs.openssl
    pkgs.curl
    pkgs.postgresql
    pkgs.redis
  ];

  env = {
    RABBITMQ_URL = "amqps://fqhtvebf:zmIU1ZA046Jr4WCoU4y--ldbl6bUIqwu@whale.rmq.cloudamqp.com/fqhtvebf";
  };

  idx = {
    extensions = [
      "google.gemini-cli-vscode-idx-companion"
      "prisma.prisma"
    ];

    workspace = {
      onCreate = {
        install-deps = "npm i -C backend && npm i -C worker";
      };
      onStart = {
        start-redis = "redis-server --daemonize yes";
        
        start-postgres-and-db = ''
          DB_DIR="$PWD/db"
          mkdir -p "$DB_DIR"
          rm -f "$DB_DIR/postmaster.pid"
          
          if [ ! -f "$DB_DIR/PG_VERSION" ]; then
            initdb -D "$DB_DIR"
          fi
          
          if ! grep -q "listen_addresses = 'localhost'" "$DB_DIR/postgresql.conf"; then
            echo "listen_addresses = 'localhost'" >> "$DB_DIR/postgresql.conf"
          fi
          
          SOCKET_DIR_CONFIG="unix_socket_directories = '$DB_DIR'"
          if ! grep -q "unix_socket_directories" "$DB_DIR/postgresql.conf"; then
            echo "$SOCKET_DIR_CONFIG" >> "$DB_DIR/postgresql.conf"
          else
            sed -i "s|.*unix_socket_directories.*|$SOCKET_DIR_CONFIG|" "$DB_DIR/postgresql.conf"
          fi
          
          pg_ctl -D "$DB_DIR" -l "$DB_DIR/logfile" start
          
          while ! pg_isready -h localhost -q; do
            sleep 1
          done
          
          if ! psql -h localhost -lqt | cut -d \| -f 1 | grep -qw analytics_db; then
            createdb -h localhost analytics_db
          fi
        '';
        
        start-backend = "cd backend && export RABBITMQ_URL=\"amqps://fqhtvebf:zmIU1ZA046Jr4WCoU4y--ldbl6bUIqwu@whale.rmq.cloudamqp.com/fqhtvebf\" && npm start &";
        start-worker = "cd worker && export DATABASE_URL=\"postgresql://user:@localhost:5432/analytics_db\" && export RABBITMQ_URL=\"amqps://fqhtvebf:zmIU1ZA046Jr4WCoU4y--ldbl6bUIqwu@whale.rmq.cloudamqp.com/fqhtvebf\" && npx prisma migrate deploy && npm start &";
      };
    };
  };
}
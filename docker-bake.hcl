group "default" {
    targets = ["server", "client"]
}

target "server" {
    context = "."
    dockerfile = "./wirv/server/dockerfile"
    args = {}
    tags = ["docker.io/dartt0n/wirv-server:latest"]
}

target "client" {
    context = "."
    dockerfile = "./wirv/client/dockerfile"
    args = {}
    tags = ["docker.io/dartt0n/wirv-client:latest"]
}
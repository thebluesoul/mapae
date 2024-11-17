# Base image
FROM golang:1.20

# Set environment variables
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# Install cfssl
RUN go install github.com/cloudflare/cfssl/cmd/cfssl@latest && \
    go install github.com/cloudflare/cfssl/cmd/cfssljson@latest

# Expose port for cfssl
EXPOSE 8889

# Entry point
ENTRYPOINT ["cfssl"]
CMD ["serve", "-address=0.0.0.0", "-port=8889"]

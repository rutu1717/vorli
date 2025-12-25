FROM gcc:10

# Create a non-root user for security
RUN useradd -m -s /bin/bash runner

# Create working directory
WORKDIR /code

# Set ownership
RUN chown runner:runner /code

# Switch to non-root user
USER runner

# Default command (will be overridden)
CMD ["/bin/bash"]

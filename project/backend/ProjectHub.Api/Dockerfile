# === Stage 1: Runtime Base Image (.NET 9 ASP.NET Core) ===
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# === Stage 2: SDK Build Environment ===
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file first to leverage Docker layer caching for NuGet packages
COPY ["ProjectHub.Api/ProjectHub.Api.csproj", "ProjectHub.Api/"]
RUN dotnet restore "ProjectHub.Api/ProjectHub.Api.csproj"

# Copy full application source files
COPY ["ProjectHub.Api/", "ProjectHub.Api/"]

# Compile solution in Release configuration
WORKDIR "/src/ProjectHub.Api"
RUN dotnet build "ProjectHub.Api.csproj" -c Release -o /app/build

# === Stage 3: Publish Application Binaries ===
FROM build AS publish
RUN dotnet publish "ProjectHub.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# === Stage 4: Optimized Production Container ===
FROM base AS final
WORKDIR /app

# Copy published compiled output from publish stage
COPY --from=publish /app/publish .

# Launch ASP.NET Core Web API application
ENTRYPOINT ["dotnet", "ProjectHub.Api.dll"]

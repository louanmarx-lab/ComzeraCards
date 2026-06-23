FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Cards.Api.csproj", "./"]
RUN dotnet restore "./Cards.Api.csproj"
COPY . .
RUN dotnet build "Cards.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Cards.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 80
ENTRYPOINT ["dotnet", "Cards.Api.dll"]

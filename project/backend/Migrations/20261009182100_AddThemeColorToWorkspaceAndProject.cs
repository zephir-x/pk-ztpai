using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddThemeColorToWorkspaceAndProject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThemeColor",
                table: "Workspaces",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#3b82f6");

            migrationBuilder.AddColumn<string>(
                name: "ThemeColor",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThemeColor",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "ThemeColor",
                table: "Projects");
        }
    }
}

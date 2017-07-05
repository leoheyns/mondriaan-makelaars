<?php 
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT Pandnaam, PandID FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
<form action="GegevensKoper2.php" method="post">
Kies een pand:<br />
<select name="PandID" /><br />
<?php
while(list($Pandnaam, $PandID) = mysql_fetch_row($resultaat))
{
    $Naam = "$Pandnaam";
		print("<option value='$PandID'>$Naam</option>");
}
?>
</select><br />
Vul uw Voornaam in:<br />
<input type="text" name="Voornaam" /><br />
Vul uw tussenvoegel in:<br />
<input type="text" name="Tussenvoegsel" /><br />
Vul uw achternaam in:<br />
<input type="text" name="Achternaam" /><br />
Vul uw geslacht in: (M/V)<br />
<input type="text" name="M/V" /><br />
Vul uw Geb_Datum in:<br />
<input type="text" name="Geb_Datum" /><br />
Vul uw Postcode in:<br />
<input type="text" name="Postcode" /><br />
Vul uw Regio in:<br />
<input type="text" name="Regio" /><br />
Vul uw Plaats in:<br />
<input type="text" name="Plaats" /><br />
Vul uw Telefoonnummer in:<br />
<input type="text" name="Telefoonnummer" /><br />
Vul uw Email adres in:<br />
<input type="text" name="EmailKoper" /><br />
<input type="submit" value="Verzend" />
</form>
</body>
</html>

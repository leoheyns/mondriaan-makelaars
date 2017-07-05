<form action="KostenscriptB.php" method="post">
maximale kosten<br />
<input type="text" name="KostenMax" maxlength="6" /><br />
minimale kosten:<br />
<input type="text" name="KostenMin" maxlength="6" /><br />
<input type="submit" value="Verzend" />
</form>
<?php
$KostenMax = $_POST["KostenMax"];
$KostenMin = $_POST["KostenMin"];

if (!is_numeric($KostenMax))
{
print("Je hebt een fout bestelnummer ingevuld!");
}
elseif (!is_numeric($KostenMin))
{
print("Je hebt een foute datum ingevuld!");
}
else
{
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT * FROM panden Where Verkoopprijs BETWEEN $KostenMin AND $KostenMax",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

print("<table><tr><td>PandID</td><td>Pand naam</td><td>VerkoperID</td>
		<td>Verkoop datum</td><td>Inkoopprijs</td><td>Verkoopprijs</td>
		<td>Verkocht?</td><td>RegioPand</td><td>Type</td><td>Plaatje</td>
		<td>Postcode</td><td>Plaats</td><td>Oppervlakte</td><td>Slaapkamers</td>
		<td>Richting tuin</td></tr>");
	 while(list($PandID,$PandNaam,$VerkoperID,$VerkoopDatum,$Inkoopprijs,$Verkoopprijs,$Verkocht,$RegioPand,$Type,$Plaatje,$Postcode,$Plaats,$Oppervlakte,$Slaapkamers,$RichtingTuin) = mysql_fetch_row($resultaat))
	 {
		$Link = "<a href=\"PandDetails.php/?PandID=$PandID\">$PandNaam</a>";
		$Image = "<img src=$Plaatje alt=\"plaatje\" style=\"width:200;height:100;\">";
	  	echo("<tr><td>$PandID</td><td>$Link</td><td>$VerkoperID</td>
		<td>$VerkoopDatum</td><td>$Inkoopprijs</td><td>$Verkoopprijs</td>
		<td>$Verkocht</td><td>$RegioPand</td><td>$Type</td><td>$Image</td>
		<td>$Postcode</td><td>$Plaats</td><td>$Oppervlakte</td><td>$Slaapkamers</td>
		<td>$RichtingTuin</td></tr>");
	 }	
print("</table>");
}
?>
